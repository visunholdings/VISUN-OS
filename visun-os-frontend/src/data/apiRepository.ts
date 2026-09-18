// Lớp truy cập backend thật (Supabase), song song với LocalDemoRepository ở src/store.tsx.
// CHƯA được nối vào App.tsx/store.tsx — xem src/data/README.md để biết lý do và các bước còn lại.
// Mỗi hàm khớp đúng một dòng trong bảng "Hợp đồng request/response" ở
// visun-os-frontend/docs/BACKEND_CONTRACT.md và các hàm rpc_* trong visun-os-backend/supabase/migrations/0007_server_operations.sql.
import { requireSupabase } from './supabaseClient'
import { mapInboxRow, mapTaskRow, type ApiTask, type InboxItemRow, type TaskRow } from './types'
import type { InboxItem, Task } from '../domain'

export type OperationResult<T> =
  | { status: 'success' } & T
  | { status: 'validation_error' | 'forbidden' | 'conflict' | 'retryable_error'; message: string }

// ===== Phiên đăng nhập =====
// Email + mật khẩu (không dùng magic link nữa: tránh lỗi link hết hạn do phần mềm quét email tự mở hộ,
// và không có màn hình đăng ký ở đây -> chỉ tài khoản đã được đặt mật khẩu từ trước mới vào được).
export async function signInWithPassword(email: string, password: string) {
  const { error } = await requireSupabase().auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await requireSupabase().auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(callback: (userId: string | null) => void) {
  const { data } = requireSupabase().auth.onAuthStateChange((_event, session) => {
    callback(session?.user.id ?? null)
  })
  return () => data.subscription.unsubscribe()
}

// ===== Workspace =====
// Bản một người dùng: lấy workspace đầu tiên còn hiệu lực của user đang đăng nhập.
// Nếu chưa có workspace nào (lần đăng nhập đầu), gọi create_workspace() để bootstrap.
export async function getOrCreateMyWorkspace(defaultName: string): Promise<{ workspaceId: string; role: 'owner' | 'member' | 'viewer' }> {
  const sb = requireSupabase()
  const { data: userData, error: userError } = await sb.auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('Chưa đăng nhập.')
  // memberships_select cho phép đọc mọi dòng membership của workspace mình thuộc về (để hiển thị đồng đội),
  // không riêng dòng của mình — nếu không lọc user_id, workspace có từ 2 thành viên trở lên sẽ có thể trả
  // nhầm vai trò của người khác thay vì của chính người đang đăng nhập.
  const { data: memberships, error } = await sb
    .from('memberships')
    .select('workspace_id, role')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .limit(1)
  if (error) throw error
  if (memberships && memberships.length > 0) {
    return { workspaceId: memberships[0].workspace_id, role: memberships[0].role }
  }
  const { data: workspaceId, error: createError } = await sb.rpc('create_workspace', { p_name: defaultName })
  if (createError) throw createError
  return { workspaceId: workspaceId as string, role: 'owner' }
}

// ===== Inbox =====
export async function listInboxItems(workspaceId: string): Promise<InboxItem[]> {
  const { data, error } = await requireSupabase()
    .from('inbox_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as InboxItemRow[]).map(mapInboxRow)
}

export async function createInboxItem(workspaceId: string, content: string): Promise<InboxItem> {
  const { data, error } = await requireSupabase()
    .from('inbox_items')
    .insert({ workspace_id: workspaceId, content })
    .select('*')
    .single()
  if (error) throw error
  return mapInboxRow(data as InboxItemRow)
}

export type InboxConvertTarget =
  | { type: 'task'; payload: { title: string; description?: string; dueAt?: string; customerId?: string; opportunityId?: string; projectId?: string; assigneeId?: string } }
  | { type: 'note'; payload: { title: string; content?: string; noteType?: 'call' | 'meeting' | 'idea' | 'decision' | 'update'; customerId?: string; opportunityId?: string; projectId?: string } }
  | { type: 'opportunity'; payload: { title: string; customerId: string; customerType?: 'B2C' | 'B2B'; stage: string; ownerId?: string } }
  | { type: 'content'; payload: { title: string; audience?: 'B2C' | 'B2B'; pillar?: string } }

// Khớp rpc_inbox_convert(workspace_id, inbox_item_id, targets, request_id) — một giao dịch tạo mọi đích,
// gọi lại cùng requestId (dùng crypto.randomUUID() phía client, giữ nguyên khi bấm lại/tải lại) không tạo trùng.
export async function convertInbox(
  workspaceId: string,
  inboxItemId: string,
  targets: InboxConvertTarget[],
  requestId: string
): Promise<OperationResult<{ inboxItemId: string; createdTargets: { type: string; id: string }[] }>> {
  const { data, error } = await requireSupabase().rpc('rpc_inbox_convert', {
    p_workspace_id: workspaceId,
    p_inbox_item_id: inboxItemId,
    p_targets: targets,
    p_request_id: requestId,
  })
  if (error) throw error
  return data as OperationResult<{ inboxItemId: string; createdTargets: { type: string; id: string }[] }>
}

// ===== Task =====
export async function listTasks(workspaceId: string): Promise<ApiTask[]> {
  const { data, error } = await requireSupabase()
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('archived_at', null)
    .order('due_at', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data as TaskRow[]).map(mapTaskRow)
}

export async function createTask(workspaceId: string, patch: {
  title: string; description?: string; dueAt?: string; priority?: Task['priority']
  customerId?: string; opportunityId?: string; projectId?: string; assigneeId: string
  sourceInboxId?: string; sourceNoteId?: string
}): Promise<ApiTask> {
  const { data, error } = await requireSupabase()
    .from('tasks')
    .insert({
      workspace_id: workspaceId,
      title: patch.title,
      description: patch.description ?? '',
      due_at: patch.dueAt ?? null,
      priority: patch.priority ?? 'medium',
      customer_id: patch.customerId ?? null,
      opportunity_id: patch.opportunityId ?? null,
      project_id: patch.projectId ?? null,
      assignee_id: patch.assigneeId,
      source_inbox_id: patch.sourceInboxId ?? null,
      source_note_id: patch.sourceNoteId ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapTaskRow(data as TaskRow)
}

// Cập nhật lạc quan (optimistic concurrency): chỉ ghi khi revision phía client vẫn khớp bản mới nhất trên server.
// 0 dòng trả về nghĩa là đã có người khác sửa trước -> conflict, giao diện phải yêu cầu tải lại.
export async function updateTask(
  taskId: string,
  expectedRevision: number,
  patch: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueAt' | 'reviewAt' | 'assigneeId'>>
): Promise<OperationResult<{ task: ApiTask }>> {
  const columnPatch: Record<string, unknown> = {}
  if (patch.title !== undefined) columnPatch.title = patch.title
  if (patch.description !== undefined) columnPatch.description = patch.description
  if (patch.status !== undefined) columnPatch.status = patch.status
  if (patch.priority !== undefined) columnPatch.priority = patch.priority
  if (patch.dueAt !== undefined) columnPatch.due_at = patch.dueAt
  if (patch.reviewAt !== undefined) columnPatch.review_at = patch.reviewAt
  if (patch.assigneeId !== undefined) columnPatch.assignee_id = patch.assigneeId

  const { data, error } = await requireSupabase()
    .from('tasks')
    .update(columnPatch)
    .eq('id', taskId)
    .eq('revision', expectedRevision)
    .select('*')
  if (error) throw error
  if (!data || data.length === 0) {
    return { status: 'conflict', message: 'Việc này đã bị người khác sửa; tải lại trước khi lưu tiếp.' }
  }
  return { status: 'success', task: mapTaskRow(data[0] as TaskRow) }
}

// Khớp rpc_task_complete(workspace_id, task_id, revision, request_id): hoàn thành + sinh occurrence kế tiếp
// nếu là việc lặp, trong một giao dịch; gọi lại cùng requestId không sinh thêm occurrence.
export async function completeTask(
  workspaceId: string,
  taskId: string,
  revision: number,
  requestId: string
): Promise<OperationResult<{ task: { id: string; status: string }; nextOccurrence: { id: string; dueAt: string } | null }>> {
  const { data, error } = await requireSupabase().rpc('rpc_task_complete', {
    p_workspace_id: workspaceId,
    p_task_id: taskId,
    p_revision: revision,
    p_request_id: requestId,
  })
  if (error) throw error
  return data as OperationResult<{ task: { id: string; status: string }; nextOccurrence: { id: string; dueAt: string } | null }>
}

// Khớp rpc_opportunity_create_project(workspace_id, opportunity_id, project_draft, request_id).
export async function createProjectFromOpportunity(
  workspaceId: string,
  opportunityId: string,
  projectDraft: { title?: string; type?: string; objective?: string },
  requestId: string
): Promise<OperationResult<{ projectId: string }>> {
  const { data, error } = await requireSupabase().rpc('rpc_opportunity_create_project', {
    p_workspace_id: workspaceId,
    p_opportunity_id: opportunityId,
    p_project_draft: projectDraft,
    p_request_id: requestId,
  })
  if (error) throw error
  return data as OperationResult<{ projectId: string }>
}

// ===== Google Calendar (chỉ đọc, BE4) =====
export type CalendarConnection = {
  id: string
  accountEmail: string | null
  status: 'connected' | 'expired' | 'revoked'
  lastSyncedAt: string | null
}

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
}

// Gọi Edge Function google-oauth-start (khớp mục 0012 trong visun-os-backend) để lấy URL đồng ý của
// Google; nơi gọi hàm này (pagesLive.tsx) tự điều hướng trình duyệt tới URL trả về.
export async function startGoogleCalendarConnect(workspaceId: string): Promise<string> {
  const { data, error } = await requireSupabase().functions.invoke('google-oauth-start', { body: { workspaceId } })
  if (error) throw error
  if (data?.status !== 'success') throw new Error(data?.message ?? 'Không tạo được liên kết kết nối Google.')
  return data.url as string
}

export async function getCalendarConnection(workspaceId: string): Promise<CalendarConnection | null> {
  const { data, error } = await requireSupabase()
    .from('calendar_connections')
    .select('id, account_email, status, last_synced_at')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { id: data.id, accountEmail: data.account_email, status: data.status, lastSyncedAt: data.last_synced_at }
}

export async function syncGoogleCalendar(workspaceId: string): Promise<OperationResult<{ synced: number }>> {
  const { data, error } = await requireSupabase().functions.invoke('google-calendar-sync', { body: { workspaceId } })
  if (error) throw error
  return data as OperationResult<{ synced: number }>
}

export async function listCalendarEvents(workspaceId: string): Promise<CalendarEvent[]> {
  const { data, error } = await requireSupabase()
    .from('calendar_events')
    .select('id, title, start, end, all_day')
    .eq('workspace_id', workspaceId)
    .eq('cancelled', false)
    .gte('start', new Date().toISOString())
    .order('start', { ascending: true })
    .limit(10)
  if (error) throw error
  return (data ?? []).map((row) => ({ id: row.id, title: row.title, start: row.start, end: row.end, allDay: row.all_day }))
}
