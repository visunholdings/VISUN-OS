// Đồng bộ sự kiện Google Calendar (chỉ đọc) vào bảng calendar_events. Chạy với phiên đăng nhập thật
// của người dùng (JWT chuyển tiếp) nên vẫn theo đúng RLS ở calendar_connections/calendar_events —
// không có đường tắt bỏ qua quyền. Khớp lệnh "calendar.sync" ở docs/BACKEND_CONTRACT.md.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { decryptToken } from '../_shared/crypto.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ status: 'forbidden', message: 'Thiếu phiên đăng nhập.' }, 401)

  try {
    const { workspaceId } = await req.json()
    if (!workspaceId) return json({ status: 'validation_error', message: 'Thiếu workspaceId.' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ status: 'forbidden', message: 'Phiên đăng nhập không hợp lệ.' }, 401)

    const { data: connection, error: connError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (connError || !connection) {
      return json({ status: 'validation_error', message: 'Chưa kết nối Google Calendar.' })
    }
    if (!connection.refresh_token_encrypted) {
      return json({ status: 'validation_error', message: 'Thiếu refresh token; hãy kết nối lại Google Calendar.' })
    }

    const refreshToken = await decryptToken(connection.refresh_token_encrypted)
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    const refreshBody = await refreshRes.json()
    if (!refreshRes.ok || !refreshBody.access_token) {
      await supabase.from('calendar_connections').update({ status: 'expired' }).eq('workspace_id', workspaceId).eq('user_id', user.id)
      return json({ status: 'validation_error', message: 'Không làm mới được token; hãy kết nối lại Google Calendar.' })
    }

    const timeMin = new Date().toISOString()
    const eventsUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    eventsUrl.searchParams.set('timeMin', timeMin)
    eventsUrl.searchParams.set('maxResults', '30')
    eventsUrl.searchParams.set('singleEvents', 'true')
    eventsUrl.searchParams.set('orderBy', 'startTime')

    const eventsRes = await fetch(eventsUrl, {
      headers: { Authorization: `Bearer ${refreshBody.access_token}` },
    })
    const eventsBody = await eventsRes.json()
    if (!eventsRes.ok) {
      return json({ status: 'retryable_error', message: eventsBody?.error?.message ?? 'Lỗi khi gọi Google Calendar API.' })
    }

    const items = (eventsBody.items ?? []) as Array<Record<string, unknown>>
    let upserted = 0
    for (const item of items) {
      const start = (item.start as Record<string, string>)?.dateTime ?? (item.start as Record<string, string>)?.date
      const end = (item.end as Record<string, string>)?.dateTime ?? (item.end as Record<string, string>)?.date
      if (!start || !end || item.status === 'cancelled') continue
      const { error: upsertError } = await supabase.from('calendar_events').upsert(
        {
          workspace_id: workspaceId,
          connection_id: connection.id,
          external_event_id: item.id,
          calendar_id: 'primary',
          title: item.summary ?? '(Không có tiêu đề)',
          start,
          end,
          all_day: !(item.start as Record<string, string>)?.dateTime,
          cancelled: false,
        },
        { onConflict: 'connection_id,external_event_id' }
      )
      if (!upsertError) upserted += 1
    }

    await supabase.from('calendar_connections').update({ status: 'connected', last_synced_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId).eq('user_id', user.id)

    return json({ status: 'success', synced: upserted })
  } catch (err) {
    return json({ status: 'retryable_error', message: String(err) }, 500)
  }
})
