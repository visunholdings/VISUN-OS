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
import { getAuthenticatedClient } from './lib/google_auth.mjs'
import { google } from 'googleapis'

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

server.registerTool(
  'gmail_list_emails',
  {
    description: 'Lấy danh sách các email mới/chưa đọc từ Gmail.',
    inputSchema: {
      maxResults: z.number().optional().describe('Số lượng email tối đa cần lấy. Mặc định 10.'),
      query: z.string().optional().describe('Câu truy vấn tìm kiếm Gmail, ví dụ: "is:unread". Mặc định "is:unread".'),
    },
  },
  async ({ maxResults = 10, query = 'is:unread' }) => {
    try {
      const auth = await getAuthenticatedClient()
      const gmail = google.gmail({ version: 'v1', auth })
      const res = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
      })
      
      const messages = res.data.messages || []
      if (messages.length === 0) {
        return textResult('Không có email nào phù hợp.')
      }

      const emailDetails = await Promise.all(
        messages.map(async (msg) => {
          const msgData = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          })
          const headers = msgData.data.payload.headers
          const getHeader = (name) => headers.find(h => h.name === name)?.value || ''
          return {
            id: msg.id,
            snippet: msgData.data.snippet,
            from: getHeader('From'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
          }
        })
      )
      return textResult(emailDetails)
    } catch (error) {
      return errorResult(error.message)
    }
  }
)

server.registerTool(
  'gmail_send_email',
  {
    description: 'Gửi email qua Gmail.',
    inputSchema: {
      to: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1),
    },
  },
  async ({ to, subject, body }) => {
    try {
      const auth = await getAuthenticatedClient()
      const gmail = google.gmail({ version: 'v1', auth })
      
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`
      const messageParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body,
      ]
      const message = messageParts.join('\n')
      
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      })
      
      return textResult(res.data)
    } catch (error) {
      return errorResult(error.message)
    }
  }
)

server.registerTool(
  'google_calendar_list_events',
  {
    description: 'Lấy danh sách các sự kiện sắp tới từ Google Calendar.',
    inputSchema: {
      maxResults: z.number().optional().describe('Số lượng sự kiện tối đa cần lấy. Mặc định 10.'),
      timeMin: z.string().optional().describe('Thời gian bắt đầu lấy sự kiện (ISO 8601). Mặc định là hiện tại.'),
    },
  },
  async ({ maxResults = 10, timeMin = new Date().toISOString() }) => {
    try {
      const auth = await getAuthenticatedClient()
      const calendar = google.calendar({ version: 'v3', auth })
      
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      })
      
      const events = res.data.items || []
      if (events.length === 0) {
        return textResult('Không có sự kiện nào sắp tới.')
      }

      const eventDetails = events.map(event => {
        const start = event.start.dateTime || event.start.date
        const end = event.end.dateTime || event.end.date
        return {
          id: event.id,
          summary: event.summary,
          description: event.description || '',
          start,
          end,
          htmlLink: event.htmlLink,
        }
      })
      return textResult(eventDetails)
    } catch (error) {
      return errorResult(error.message)
    }
  }
)

server.registerTool(
  'google_calendar_create_event',
  {
    description: 'Tạo một sự kiện mới trên Google Calendar.',
    inputSchema: {
      summary: z.string().min(1).describe('Tiêu đề sự kiện'),
      description: z.string().optional().describe('Mô tả sự kiện'),
      startDateTime: z.string().describe('Thời gian bắt đầu (ISO 8601, VD: 2026-09-20T10:00:00+07:00)'),
      endDateTime: z.string().describe('Thời gian kết thúc (ISO 8601, VD: 2026-09-20T11:00:00+07:00)'),
    },
  },
  async ({ summary, description, startDateTime, endDateTime }) => {
    try {
      const auth = await getAuthenticatedClient()
      const calendar = google.calendar({ version: 'v3', auth })
      
      const event = {
        summary,
        description,
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
      }
      
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      })
      
      return textResult({
        id: res.data.id,
        htmlLink: res.data.htmlLink,
        summary: res.data.summary,
      })
    } catch (error) {
      return errorResult(error.message)
    }
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)
