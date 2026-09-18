#!/usr/bin/env node
// Đăng nhập một lần cho MCP server — email + mật khẩu (giống hệt trang /live), không cần mở
// trình duyệt hay cấu hình redirect URL trên Supabase.
//
// Cách chạy: node login.mjs ban@vidu.com
// Sẽ hỏi mật khẩu ngay trong Terminal (ký tự gõ vào sẽ hiện ra bình thường — máy cá nhân, không qua mạng).
import { createClient } from '@supabase/supabase-js'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/config.mjs'
import { saveStoredSession } from './lib/session.mjs'

const email = process.argv[2]
if (!email) {
  console.error('Dùng: node login.mjs ban@vidu.com')
  process.exit(1)
}

const rl = createInterface({ input: stdin, output: stdout })
const password = (await rl.question('Mật khẩu: ')).trim()
rl.close()
if (!password) {
  console.error('Chưa nhập mật khẩu.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
if (error || !data.session) {
  console.error('Đăng nhập thất bại:', error?.message || 'không rõ lỗi')
  process.exit(1)
}

saveStoredSession(data.session)
console.log(`\nĐăng nhập thành công: ${data.user.email}`)
console.log('Đã lưu phiên tại ~/.visun-os-mcp/session.json')
console.log('Bây giờ khởi động lại Claude Desktop để dùng MCP server VISUN OS.')
process.exit(0)
