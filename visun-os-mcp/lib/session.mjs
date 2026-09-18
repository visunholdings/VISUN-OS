// Lưu/khôi phục phiên đăng nhập Supabase trên đĩa cục bộ (chỉ máy này đọc được, quyền tệp 600).
// server.mjs dùng để khôi phục phiên khi Claude Desktop khởi động MCP server; login.mjs dùng để lưu lần đầu.
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.mjs'

const SESSION_DIR = join(homedir(), '.visun-os-mcp')
const SESSION_FILE = join(SESSION_DIR, 'session.json')

export function loadStoredSession() {
  if (!existsSync(SESSION_FILE)) return null
  try {
    return JSON.parse(readFileSync(SESSION_FILE, 'utf8'))
  } catch {
    return null
  }
}

export function saveStoredSession(session) {
  mkdirSync(SESSION_DIR, { recursive: true, mode: 0o700 })
  writeFileSync(
    SESSION_FILE,
    JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token }, null, 2),
    { mode: 0o600 }
  )
}

// Tạo client Supabase và khôi phục phiên đã lưu; trả về null nếu chưa từng đăng nhập hoặc phiên không còn hợp lệ.
export async function createAuthenticatedClient() {
  const stored = loadStoredSession()
  if (!stored) return null

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: true },
  })

  // supabase-js xoay vòng refresh_token mỗi lần làm mới token — phải lưu lại bản mới, nếu không
  // lần chạy server sau (Claude Desktop khởi động lại) sẽ dùng refresh_token cũ đã hết hiệu lực.
  supabase.auth.onAuthStateChange((event, newSession) => {
    if (newSession && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
      saveStoredSession(newSession)
    }
  })

  const { data, error } = await supabase.auth.setSession({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
  })
  if (error || !data.session) return null
  return supabase
}
