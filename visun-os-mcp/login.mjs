#!/usr/bin/env node
// Đăng nhập một lần cho MCP server — dùng lại đúng cơ chế magic-link email đã kiểm chứng ở
// visun-os-frontend/src/pagesLive.tsx (Supabase Auth signInWithOtp), chỉ khác điểm quay về:
// thay vì quay về trang web, link quay về một server tạm trên máy này để lấy phiên đăng nhập.
//
// Cách chạy: node login.mjs ban@vidu.com
// Trước khi chạy lần đầu, phải thêm http://localhost:51739 vào Supabase Dashboard →
// Authentication → URL Configuration → Redirect URLs (xem README.md).
import { createClient } from '@supabase/supabase-js'
import { createServer } from 'node:http'
import { SUPABASE_URL, SUPABASE_ANON_KEY, LOGIN_CALLBACK_PORT } from './lib/config.mjs'
import { saveStoredSession } from './lib/session.mjs'

const REDIRECT_URL = `http://localhost:${LOGIN_CALLBACK_PORT}`
const email = process.argv[2]
if (!email) {
  console.error('Dùng: node login.mjs ban@vidu.com')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })

const CALLBACK_PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><title>VISUN OS — đăng nhập MCP</title></head>
<body style="font-family:-apple-system,sans-serif;padding:40px;max-width:480px;margin:0 auto">
<h2 id="msg">Đang xử lý đăng nhập...</h2>
<script>
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
  const params = new URLSearchParams(hash)
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  const error_description = params.get('error_description')
  const msg = document.getElementById('msg')
  if (error_description) {
    msg.textContent = 'Đăng nhập thất bại: ' + error_description.replace(/\\+/g, ' ')
  } else if (access_token && refresh_token) {
    fetch('/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token, refresh_token }) })
      .then(() => { msg.textContent = 'Đăng nhập thành công. Có thể đóng tab này và quay lại Terminal.' })
      .catch(() => { msg.textContent = 'Lỗi khi lưu phiên, xem lại Terminal.' })
  } else {
    msg.textContent = 'Không tìm thấy token đăng nhập trong URL.'
  }
</script>
</body></html>`

function waitForCallback() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(CALLBACK_PAGE)
        return
      }
      if (req.method === 'POST' && req.url === '/save') {
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end('{"ok":true}')
          try {
            resolve(JSON.parse(body))
          } catch (err) {
            reject(err)
          } finally {
            server.close()
          }
        })
        return
      }
      res.writeHead(404)
      res.end()
    })
    server.listen(LOGIN_CALLBACK_PORT, () => {
      console.log(`Đang chờ đăng nhập tại ${REDIRECT_URL} ...`)
    })
    server.on('error', reject)
  })
}

console.log(`Đang gửi email đăng nhập tới ${email}...`)
const { error: otpError } = await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: REDIRECT_URL, shouldCreateUser: false },
})
if (otpError) {
  console.error('Gửi email thất bại:', otpError.message)
  process.exit(1)
}
console.log('Đã gửi email. Mở email và bấm vào link đăng nhập — chỉ bấm đúng một lần, càng sớm càng tốt\n(một số phần mềm quét email tự động mở link hộ có thể làm link hết hạn; nếu vậy hãy chạy lại lệnh này).')

const tokens = await waitForCallback()

const { data, error } = await supabase.auth.setSession(tokens)
if (error || !data.session) {
  console.error('Không xác thực được phiên:', error?.message || 'không rõ lỗi')
  process.exit(1)
}

saveStoredSession(data.session)
console.log('\nĐăng nhập thành công. Đã lưu phiên tại ~/.visun-os-mcp/session.json')
console.log('Bây giờ khởi động lại Claude Desktop để dùng MCP server VISUN OS.')
process.exit(0)
