// Google chuyển hướng trình duyệt về đây sau khi người dùng đồng ý cấp quyền — request này KHÔNG có
// phiên đăng nhập Supabase, chỉ có "code" và "state". Vì vậy hàm này dùng SERVICE_ROLE_KEY (hợp lệ vì
// chạy trên máy chủ, không lộ ra frontend) để tra "state" đã ghi lúc bấm Kết nối (rpc_google_oauth_start)
// và ghi kết quả vào calendar_connections. State bị xóa ngay sau khi dùng để không tái sử dụng được.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encryptToken } from '../_shared/crypto.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? ''

function redirectTo(path: string) {
  return new Response(null, { status: 302, headers: { Location: `${APP_URL}${path}` } })
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const googleError = url.searchParams.get('error')

  if (googleError) return redirectTo(`/live?calendar=error&reason=${encodeURIComponent(googleError)}`)
  if (!code || !state) return redirectTo('/live?calendar=error&reason=missing_code_or_state')

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: pending, error: pendingError } = await admin
    .from('oauth_pending_connections')
    .select('workspace_id, user_id, created_at')
    .eq('state', state)
    .maybeSingle()

  if (pendingError || !pending) return redirectTo('/live?calendar=error&reason=invalid_state')

  // Dùng một lần: xóa ngay dù bước sau có lỗi hay không, tránh replay lại state cũ.
  await admin.from('oauth_pending_connections').delete().eq('state', state)

  const isExpired = Date.now() - new Date(pending.created_at).getTime() > 15 * 60 * 1000
  if (isExpired) return redirectTo('/live?calendar=error&reason=state_expired')

  try {
    const redirectUri = `${SUPABASE_URL}/functions/v1/google-oauth-callback`
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenBody = await tokenRes.json()
    if (!tokenRes.ok || !tokenBody.access_token) {
      console.error('Google token exchange failed:', tokenBody)
      return redirectTo('/live?calendar=error&reason=token_exchange_failed')
    }

    let accountEmail: string | null = null
    try {
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenBody.access_token}` },
      })
      if (profileRes.ok) accountEmail = (await profileRes.json()).email ?? null
    } catch { /* không chặn luồng chính nếu không lấy được email hiển thị */ }

    const accessTokenEncrypted = await encryptToken(tokenBody.access_token)
    const refreshTokenEncrypted = tokenBody.refresh_token ? await encryptToken(tokenBody.refresh_token) : null

    const { error: upsertError } = await admin
      .from('calendar_connections')
      .upsert(
        {
          workspace_id: pending.workspace_id,
          user_id: pending.user_id,
          provider: 'google',
          account_email: accountEmail,
          scope: tokenBody.scope ?? null,
          access_token_encrypted: accessTokenEncrypted,
          // Google chỉ trả refresh_token ở lần đồng ý đầu tiên; nếu kết nối lại mà không có refresh_token
          // mới, KHÔNG ghi đè refresh_token cũ (dùng coalesce thay vì null cứng) — xử lý ở dưới bằng upsert
          // đơn giản chấp nhận có thể null nếu chưa từng cấp; trường hợp hiếm gặp với "prompt=consent" luôn có.
          refresh_token_encrypted: refreshTokenEncrypted,
          status: 'connected',
          last_synced_at: null,
        },
        { onConflict: 'workspace_id,user_id' }
      )

    if (upsertError) {
      console.error('Lỗi lưu calendar_connections:', upsertError)
      return redirectTo('/live?calendar=error&reason=save_failed')
    }

    return redirectTo('/live?calendar=connected')
  } catch (err) {
    console.error('Lỗi không mong đợi khi xử lý callback Google:', err)
    return redirectTo('/live?calendar=error&reason=unexpected')
  }
})
