// Trang kết nối THẬT tới Supabase — tách riêng khỏi 14 trang demo (dùng localStorage qua src/store.tsx).
// Đây là "luồng chứng minh đầu tiên" ở mục 1 của KE_HOACH_BACKEND_VISUN_OS.md: đăng nhập → ghi nhanh →
// mở cùng mục trên máy khác → chuyển thành việc → thấy việc trên danh sách → mở lại nguồn.
// Không đụng tới App.tsx/store.tsx của bản demo; chỉ thêm một route mới độc lập.
import { useEffect, useState, type FormEvent } from 'react'
import { Card, Field, Notice, PageHeading, useToast } from './ui'
import { isBackendConfigured, supabase } from './data/supabaseClient'
import {
  signInWithEmail, getSession, onAuthStateChange, getOrCreateMyWorkspace,
  listInboxItems, createInboxItem, convertInbox, listTasks, completeTask,
} from './data/apiRepository'
import type { ApiTask } from './data/types'
import type { InboxItem } from './domain'
import { taskStatusLabel } from './domain'

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

// Supabase chuyển hướng về đây kèm "#error=...&error_code=otp_expired..." khi link đăng nhập đã hết hạn
// hoặc đã được dùng trước đó (thường do phần mềm quét email tự động mở link hộ trước khi người dùng bấm).
function readAuthHashError(): string {
  const hash = window.location.hash
  if (!hash.includes('error=')) return ''
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const code = params.get('error_code')
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  if (code === 'otp_expired') {
    return 'Link đăng nhập đã hết hạn hoặc đã được dùng trước đó — thường do phần mềm quét email tự động mở link hộ. Hãy gửi lại và bấm link càng sớm càng tốt, chỉ bấm đúng một lần.'
  }
  return params.get('error_description')?.replace(/\+/g, ' ') || 'Đăng nhập thất bại, hãy thử gửi lại link.'
}

export function LiveBackendPage() {
  const toast = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [inbox, setInbox] = useState<InboxItem[]>([])
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [quickNote, setQuickNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const hashError = readAuthHashError()
    if (hashError) setError(hashError)
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
        const [inboxItems, taskItems] = await Promise.all([listInboxItems(ws), listTasks(ws)])
        if (cancelled) return
        setInbox(inboxItems)
        setTasks(taskItems)
      })
      .catch(err => !cancelled && setError(errorMessage(err)))
    return () => { cancelled = true }
  }, [userId])

  async function refresh(ws: string) {
    const [inboxItems, taskItems] = await Promise.all([listInboxItems(ws), listTasks(ws)])
    setInbox(inboxItems)
    setTasks(taskItems)
  }

  async function handleSendOtp(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return
    setBusy(true); setError('')
    try {
      await signInWithEmail(email.trim(), `${window.location.origin}/live`)
      setOtpSent(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally { setBusy(false) }
  }

  async function handleSignOut() {
    await supabase?.auth.signOut()
    setUserId(null)
    setOtpSent(false)
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
        <PageHeading eyebrow="Kết nối thật · Supabase" title="Đăng nhập" description="Dùng email để nhận link đăng nhập một lần." />
        <Card>
          {otpSent ? (
            <Notice tone="info">Đã gửi email tới <strong>{email}</strong>. Mở email và bấm vào link để quay lại đây đã đăng nhập.</Notice>
          ) : (
            <form className="mini-form" onSubmit={handleSendOtp}>
              <Field label="Email"><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@vidu.com" /></Field>
              <button className="button primary" type="submit" disabled={busy}>Gửi link đăng nhập</button>
            </form>
          )}
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
