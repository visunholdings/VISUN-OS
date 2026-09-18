#!/usr/bin/env node
// MCP server cho Claude — bọc lại đúng 5 thao tác đã có và đã kiểm thử trên visun-os-backend
// (xem visun-os-frontend/src/data/apiRepository.ts và visun-os-backend/supabase/migrations/0007+).
// Không bịa thêm phạm vi: chỉ Hộp ghi nhanh và Công việc, đúng "luồng chứng minh đầu tiên" đã chạy
// thật trên trang /live. Chạy qua stdio, dùng phiên đăng nhập thật (không dùng service_role key)
// nên toàn bộ Row Level Security ở 0006_triggers_and_rls.sql vẫn được áp dụng như một client bình thường.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { createAuthenticatedClient } from './lib/session.mjs'

const supabase = await createAuthenticatedClient()
if (!supabase) {
  console.error('Chưa đăng nhập hoặc phiên đã hết hạn. Chạy: node login.mjs ban@vidu.com')
  process.exit(1)
}

const { data: userData, error: userError } = await supabase.auth.getUser()
if (userError || !userData.user) {
  console.error('Không xác thực được người dùng:', userError?.message || 'không rõ lỗi')
  process.exit(1)
}

// Giống getOrCreateMyWorkspace trong apiRepository.ts nhưng chỉ "get" — người dùng phải mở trang
// /live ít nhất một lần trước để workspace được tạo qua create_workspace().
const { data: memberships, error: membershipError } = await supabase
  .from('memberships')
  .select('workspace_id, role')
  .eq('user_id', userData.user.id)
  .is('revoked_at', null)
  .limit(1)
if (membershipError || !memberships?.length) {
  console.error('Không tìm thấy workspace cho tài khoản này. Hãy mở /live và đăng nhập ít nhất một lần trước.')
  process.exit(1)
}
const workspaceId = memberships[0].workspace_id

function textResult(value) {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] }
}
function errorResult(message) {
  return { content: [{ type: 'text', text: message }], isError: true }
}

const server = new McpServer({ name: 'visun-os', version: '0.1.0' })

server.registerTool(
  'list_inbox_items',
  {
    description: 'Xem các mục trong Hộp ghi nhanh của VISUN OS (dữ liệu thật, không phải bản demo).',
    inputSchema: {
      onlyNew: z.boolean().optional().describe('true = chỉ lấy mục chưa xử lý (status = new). Mặc định lấy tất cả.'),
    },
  },
  async ({ onlyNew }) => {
    let query = supabase
      .from('inbox_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
    if (onlyNew) query = query.eq('status', 'new')
    const { data, error } = await query
    if (error) return errorResult(error.message)
    return textResult(data)
  }
)

server.registerTool(
  'create_inbox_item',
  {
    description: 'Ghi nhanh một câu vào Hộp ghi nhanh VISUN OS — dùng khi cần lưu lại một việc/cam kết vừa nghe được nhưng chưa cần phân loại ngay.',
    inputSchema: {
      content: z.string().min(1).describe('Nội dung ghi nhanh, ví dụ: "Gửi đề cương cho Công ty An Phát thứ Sáu"'),
    },
  },
  async ({ content }) => {
    const { data, error } = await supabase
      .from('inbox_items')
      .insert({ workspace_id: workspaceId, content })
      .select('*')
      .single()
    if (error) return errorResult(error.message)
    return textResult(data)
  }
)

server.registerTool(
  'convert_inbox_to_task',
  {
    description: 'Chuyển một mục trong Hộp ghi nhanh (lấy inboxItemId từ list_inbox_items) thành một việc cần làm.',
    inputSchema: {
      inboxItemId: z.string().uuid(),
      title: z.string().min(1).describe('Tên việc cần làm'),
      dueAt: z.string().optional().describe('Hạn hoàn thành, định dạng YYYY-MM-DD, để trống nếu chưa có hạn'),
    },
  },
  async ({ inboxItemId, title, dueAt }) => {
    const { data, error } = await supabase.rpc('rpc_inbox_convert', {
      p_workspace_id: workspaceId,
      p_inbox_item_id: inboxItemId,
      p_targets: [{ type: 'task', payload: { title, dueAt } }],
      p_request_id: randomUUID(),
    })
    if (error) return errorResult(error.message)
    return textResult(data)
  }
)

server.registerTool(
  'list_tasks',
  {
    description: 'Xem danh sách việc cần làm trong VISUN OS, có thể lọc theo trạng thái.',
    inputSchema: {
      status: z.enum(['todo', 'doing', 'waiting', 'done', 'cancelled']).optional(),
    },
  },
  async ({ status }) => {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('archived_at', null)
      .order('due_at', { ascending: true, nullsFirst: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) return errorResult(error.message)
    return textResult(data)
  }
)

server.registerTool(
  'complete_task',
  {
    description: 'Đánh dấu hoàn thành một việc trong VISUN OS. Cần taskId và revision hiện tại (lấy từ list_tasks) để tránh ghi đè việc đã bị sửa ở nơi khác.',
    inputSchema: {
      taskId: z.string().uuid(),
      revision: z.number().int(),
    },
  },
  async ({ taskId, revision }) => {
    const { data, error } = await supabase.rpc('rpc_task_complete', {
      p_workspace_id: workspaceId,
      p_task_id: taskId,
      p_revision: revision,
      p_request_id: randomUUID(),
    })
    if (error) return errorResult(error.message)
    return textResult(data)
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)
