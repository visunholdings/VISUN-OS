#!/usr/bin/env node
// Đăng nhập Google API cho MCP server (Gmail, Calendar).
// Yêu cầu có file credentials.json (tải từ Google Cloud Console) trong thư mục này.
// 
// Cách chạy: node google_login.mjs

import { authorizeUser } from './lib/google_auth.mjs'

async function main() {
  console.log('Đang kiểm tra / yêu cầu cấp quyền Google API...')
  try {
    const client = await authorizeUser()
    console.log('\nĐăng nhập Google thành công!')
    console.log('Đã lưu phiên Google API tại ~/.visun-os-mcp/google_token.json')
    console.log('Bây giờ khởi động lại Claude Desktop (hoặc MCP server) để dùng các tính năng Google.')
  } catch (error) {
    console.error('\nĐăng nhập thất bại:', error.message || error)
  }
}

main()
