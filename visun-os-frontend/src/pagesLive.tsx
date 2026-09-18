// Trang kết nối THẬT tới Supabase — tách riêng khỏi 14 trang demo (dùng localStorage qua src/store.tsx).
// Đây là "luồng chứng minh đầu tiên" ở mục 1 của KE_HOACH_BACKEND_VISUN_OS.md: đăng nhập → ghi nhanh →
// mở cùng mục trên máy khác → chuyển thành việc → thấy việc trên danh sách → mở lại nguồn.
// Không đụng tới App.tsx/store.tsx của bản demo; chỉ thêm một route mới độc lập.
import { useEffect, useState, type FormEvent } from 'react'
import { Card, Field, Notice, PageHeading, useToast } from './ui'
import { isBackendConfigured, supabase } from './data/supabaseClient'
import {
  signInWithPassword, getSession, onAuthStateChange, getOrCreateMyWorkspace,
  listInboxItems, createInboxItem, convertInbox, listTasks, completeTask,
  startGoogleCalendarConnect, getCalendarConnection, syncGoogleCalendar, listCalendarEvents,
  type CalendarConnection, type CalendarEvent,
} from './data/apiRepository'
import type { ApiTask } from './data/types'
import type { InboxItem } from './domain'
import { taskStatusLabel } from './domain'

function readCalendarRedirectNotice(): { tone: 'info' | 'error'; message: string } | null {
  const params = new URLSearchParams(window.location.search)
  const calendarStatus = params.get('calendar')
  if (!calendarStatus) return null
  window.history.replaceState(null, '', window.location.pathname)
  if (calendarStatus === 'connected') return { tone: 'info', message: 'Đã kết nối Google Calendar thành công.' }
  const reason = params.get('reason') ?? 'không rõ nguyên nhân'
  return { tone: 'error', message: `Kết nối Google Calendar thất bại (${reason}). Hãy thử lại.` }
}

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return new Date(event.start).toLocaleDateString('vi-VN')
  const start = new Date(event.start)
  const end = new Date(event.end)
  const sameDay = start.toDateString() === end.toDateString()
  const dateStr = start.toLocaleDateString('vi-VN')
  const startTime = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const endTime = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return sameDay ? `${dateStr} · ${startTime}–${endTime}` : `${dateStr} ${startTime} → ${end.toLocaleDateString('vi-VN')} ${endTime}`
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>
    if (typeof obj.message === 'string') return obj.message
    if (typeof obj.error_description === 'string') return obj.error_description
    try { return JSON.stringify(err) } catch { /* rơi xuống String() bên dưới */ }
  }
  return String(err)
}

export function LiveBackendPage() {
  const toast = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [inbox, setInbox] = useState<InboxItem[]>([])
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [quickNote, setQuickNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; message: string } | null>(null)
  const [calendarConnection, setCalendarConnection] = useState<CalendarConnection | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setNotice(readCalendarRedirectNotice())
    if (!isBackendConfigured) { setCheckingSession(false); return }
    getSession().then(session => { setUserId(session?.user.id ?? null); setCheckingSession(false) })
      .catch(err => { setError(errorMessage(err)); setCheckingSession(false) })
    return onAuthStateChange(id => setUserId(id))
  }, [])

  useEffect(() => {
    if (!userId) { setWorkspaceId(null); return }
    let cancelled = false
    getOrCreateMyWorkspace('AI Trainer')
      .then(async ({ workspaceId: ws }) => {
        if (cancelled) return
        setWorkspaceId(ws)
        const [inboxItems, taskItems, connection, events] = await Promise.all([
          listInboxItems(ws), listTasks(ws), getCalendarConnection(ws), listCalendarEvents(ws),
        ])
        if (cancelled) return
        setInbox(inboxItems)
        setTasks(taskItems)
        setCalendarConnection(connection)
        setCalendarEvents(events)
      })
      .catch(err => !cancelled && setError(errorMessage(err)))
    return () => { cancelled = true }
  }, [userId])

  async function refresh(ws: string) {
    const [inboxItems, taskItems] = await Promise.all([listInboxItems(ws), listTasks(ws)])
    setInbox(inboxItems)
    setTasks(taskItems)
  }

  async function refreshCalendar(ws: string) {
    const [connection, events] = await Promise.all([getCalendarConnection(ws), listCalendarEvents(ws)])
    setCalendarConnection(connection)
    setCalendarEvents(events)
  }

  async function handleConnectCalendar() {
    if (!workspaceId) return
    setBusy(true); setError('')
    try {
      const url = await startGoogleCalendarConnect(workspaceId)
      window.location.href = url
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  async function handleSyncCalendar() {
    if (!workspaceId) return
    setSyncing(true); setError('')
    try {
      const result = await syncGoogleCalendar(workspaceId)
      if (result.status !== 'success') { setError(result.message); return }
      await refreshCalendar(workspaceId)
      toast(`Đã đồng bộ ${result.synced} sự kiện từ Google Calendar.`)
    } catch (err) {
      setError(errorMessage(err))
    } finally { setSyncing(false) }
  }

  async function handlePasswordLogin(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || !password) return
    setBusy(true); setError('')
    try {
      await signInWithPassword(email.trim(), password)
      setPassword('')
    } catch (err) {
      setError(errorMessage(err))
    } finally { setBusy(false) }
  }

  async function handleSignOut() {
    await supabase?.auth.signOut()
    setUserId(null)
  }

  async function handleQuickNote(event: FormEvent) {
    event.preventDefault()
    if (!workspaceId || !quickNote.trim()) return
    setBusy(true); setError('')
    try {
      await createInboxItem(workspaceId, quickNote.trim())
      setQuickNote('')
      await refresh(workspaceId)
      toast('Đã lưu vào Hộp ghi nhanh THẬT trên Supabase — mở lại trang hoặc mở máy khác vẫn còn.')
    } catch (err) {
      setError(errorMessage(err))
    } finally { setBusy(false) }
  }

  async function handleConvertToTask(item: InboxItem) {
    if (!workspaceId) return
    setBusy(true); setError('')
    try {
      const requestId = crypto.randomUUID()
      const result = await convertInbox(workspaceId, item.id, [{ type: 'task', payload: { title: item.content } }], requestId)
      if (result.status !== 'success') { setError(result.message); return }
      await refresh(workspaceId)
      toast('Đã chuyển thành việc thật qua rpc_inbox_convert.')
    } catch (err) {
      setError(errorMessage(err))
    } finally { setBusy(false) }
  }

  async function handleCompleteTask(task: ApiTask) {
    if (!workspaceId) return
    setBusy(true); setError('')
    try {
      const requestId = crypto.randomUUID()
      const result = await completeTask(workspaceId, task.id, task.revision, requestId)
      if (result.status === 'conflict') { setError(result.message); await refresh(workspaceId); return }
      if (result.status !== 'success') { setError(result.message); return }
      await refresh(workspaceId)
      toast('Đã hoàn thành việc thật qua rpc_task_complete.')
    } catch (err) {
      setError(errorMessage(err))
    } finally { setBusy(false) }
  }

  if (!isBackendConfigured) {
    return (
      <div className="page">
        <PageHeading eyebrow="Kết nối thật" title="Chưa cấu hình backend" />
        <Notice tone="warning">
          Thiếu <code>VITE_SUPABASE_URL</code>/<code>VITE_SUPABASE_ANON_KEY</code> trong <code>.env.local</code>.
          Xem <code>visun-os-backend/README.md</code> để lấy hai giá trị này.
        </Notice>
      </div>
    )
  }

  if (checkingSession) {
    return <div className="page"><PageHeading eyebrow="Kết nối thật" title="Đang kiểm tra phiên đăng nhập..." /></div>
  }

  if (!userId) {
    return (
      <div className="page">
        <PageHeading eyebrow="Kết nối thật · Supabase" title="Đăng nhập" description="Đăng nhập bằng email và mật khẩu quản trị." />
        <Card>
          <form className="mini-form" onSubmit={handlePasswordLogin}>
            <Field label="Email"><input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@vidu.com" /></Field>
            <Field label="Mật khẩu"><input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></Field>
            <button className="button primary" type="submit" disabled={busy}>Đăng nhập</button>
          </form>
          {error && <Notice tone="error">{error}</Notice>}
        </Card>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeading
        eyebrow="Kết nối thật · Supabase"
        title="Hộp ghi nhanh & Công việc"
        description={`Workspace: ${workspaceId ?? '...'} — dữ liệu ghi thẳng vào database thật, tải lại trang vẫn còn.`}
        action={<button className="text-button" onClick={handleSignOut}>Đăng xuất</button>}
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}

      <Card title="Lịch (Google Calendar)">
        {!calendarConnection ? (
          <>
            <p>Chưa kết nối. Chỉ đọc lịch, không sửa/xóa sự kiện trên Google.</p>
            <button className="button primary" disabled={busy} onClick={handleConnectCalendar}>Kết nối Google Calendar</button>
          </>
        ) : (
          <>
            <div className="mini-form" style={{ justifyContent: 'space-between' }}>
              <span>
                Đã kết nối{calendarConnection.accountEmail ? `: ${calendarConnection.accountEmail}` : ''}
                {' · '}
                {calendarConnection.status === 'connected' ? 'Đang hoạt động' : calendarConnection.status === 'expired' ? 'Hết hạn, cần kết nối lại' : 'Đã thu hồi'}
              </span>
              <button className="button small outline" disabled={syncing} onClick={handleSyncCalendar}>{syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</button>
            </div>
            {calendarConnection.lastSyncedAt && <small>Lần đồng bộ gần nhất: {new Date(calendarConnection.lastSyncedAt).toLocaleString('vi-VN')}</small>}
            {calendarConnection.status === 'expired' && (
              <button className="button small primary" style={{ marginTop: 8 }} disabled={busy} onClick={handleConnectCalendar}>Kết nối lại</button>
            )}
            <div className="stack" style={{ marginTop: 12 }}>
              {calendarEvents.length === 0 && <p>Chưa có sự kiện sắp tới (hoặc chưa đồng bộ lần nào).</p>}
              {calendarEvents.map(event => (
                <div className="mini-form" key={event.id} style={{ justifyContent: 'space-between' }}>
                  <span>{event.title}</span>
                  <small>{formatEventTime(event)}</small>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card title="Ghi nhanh">
        <form className="mini-form" onSubmit={handleQuickNote}>
          <input value={quickNote} onChange={e => setQuickNote(e.target.value)} placeholder='Vd: "Gửi đề cương cho Công ty An Phát thứ Sáu"' disabled={busy} />
          <button className="button primary" type="submit" disabled={busy || !quickNote.trim()}>Lưu</button>
        </form>
        <div className="stack" style={{ marginTop: 12 }}>
          {inbox.length === 0 && <p>Chưa có mục nào.</p>}
          {inbox.map(item => (
            <div className="mini-form" key={item.id} style={{ justifyContent: 'space-between' }}>
              <span>{item.content} <small>({item.status})</small></span>
              {item.status === 'new' && <button className="button small outline" disabled={busy} onClick={() => handleConvertToTask(item)}>Chuyển thành việc</button>}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Công việc">
        {tasks.length === 0 && <p>Chưa có việc nào.</p>}
        {tasks.map(task => (
          <div className="mini-form" key={task.id} style={{ justifyContent: 'space-between' }}>
            <span>{task.title} <small>({taskStatusLabel[task.status]})</small></span>
            {task.status !== 'done' && <button className="button small outline" disabled={busy} onClick={() => handleCompleteTask(task)}>Hoàn thành</button>}
          </div>
        ))}
      </Card>
    </div>
  )
}
