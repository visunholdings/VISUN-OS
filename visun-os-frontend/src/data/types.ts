// Kiểu dữ liệu thô trả về từ Supabase (snake_case, khớp cột trong visun-os-backend/supabase/migrations)
// và hàm chuyển sang kiểu domain (camelCase) mà các trang đang dùng trong src/domain.ts.
// Đây là điểm khớp trực tiếp giữa schema backend và type frontend — sửa cột ở backend phải sửa cả ở đây.
import type { InboxItem, Task, TaskStatus, Priority } from '../domain'

// domain.ts (dùng cho bản demo) không có "revision" vì localStorage không cần chống ghi đè.
// Backend thật cần revision cho cập nhật lạc quan (mục "Ràng buộc giao dịch" trong BACKEND_CONTRACT.md),
// nên phía API mở rộng thêm field này thay vì sửa domain.ts — tránh ảnh hưởng 14 trang demo đang dùng Task.
export type ApiTask = Task & { revision: number }

export type TaskRow = {
  id: string
  workspace_id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  due_at: string | null
  review_at: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  customer_id: string | null
  opportunity_id: string | null
  project_id: string | null
  source_note_id: string | null
  source_inbox_id: string | null
  assignee_id: string
  promised_to: string | null
  recurring_series_id: string | null
  created_at: string
  updated_at: string
  created_by: string
  archived_at: string | null
  revision: number
}

export function mapTaskRow(row: TaskRow): ApiTask {
  return {
    id: row.id,
    revision: row.revision,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at ?? undefined,
    reviewAt: row.review_at ?? undefined,
    scheduledStart: row.scheduled_start ?? undefined,
    scheduledEnd: row.scheduled_end ?? undefined,
    customerId: row.customer_id ?? undefined,
    opportunityId: row.opportunity_id ?? undefined,
    projectId: row.project_id ?? undefined,
    sourceNoteId: row.source_note_id ?? undefined,
    sourceInboxId: row.source_inbox_id ?? undefined,
    assigneeId: row.assignee_id,
    promisedTo: row.promised_to ?? undefined,
    recurringSeriesId: row.recurring_series_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    archived: !!row.archived_at,
  }
}

export type InboxItemRow = {
  id: string
  workspace_id: string
  content: string
  status: InboxItem['status']
  created_at: string
  updated_at: string
  created_by: string
  archived_at: string | null
}

export function mapInboxRow(row: InboxItemRow): InboxItem {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    archived: !!row.archived_at,
  }
}
