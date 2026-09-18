// Bắt đầu luồng kết nối Google Calendar: người dùng đang đăng nhập (JWT thật) gọi hàm này,
// nhận về URL đồng ý của Google để trình duyệt chuyển hướng tới.
// Khớp lệnh "calendar.connect" ở mục "Chiến lược truy cập" trong docs/BACKEND_CONTRACT.md.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'].join(' ')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ status: 'forbidden', message: 'Thiếu phiên đăng nhập.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { workspaceId } = await req.json()
    if (!workspaceId) {
      return new Response(JSON.stringify({ status: 'validation_error', message: 'Thiếu workspaceId.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Client mang JWT của người dùng để rpc_google_oauth_start chạy đúng với quyền/role của họ (RLS bình thường).
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: state, error } = await userClient.rpc('rpc_google_oauth_start', { p_workspace_id: workspaceId })
    if (error) {
      return new Response(JSON.stringify({ status: 'forbidden', message: error.message }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/google-oauth-callback`
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', SCOPES)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', state as string)

    return new Response(JSON.stringify({ status: 'success', url: authUrl.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ status: 'retryable_error', message: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
