import { promises as fs } from 'node:fs'
import path from 'node:path'
import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'
import os from 'node:os'

// Các quyền (scopes) cần thiết cho Gmail và Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
]

// Đường dẫn file lưu trữ
const TOKEN_PATH = path.join(os.homedir(), '.visun-os-mcp', 'google_token.json')
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json')

/**
 * Đọc file token.json đã lưu.
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8')
    const credentials = JSON.parse(content)
    return google.auth.fromJSON(credentials)
  } catch (err) {
    return null
  }
}

/**
 * Lưu credentials ra file để dùng cho các lần chạy sau.
 * @param {OAuth2Client} client
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8')
  const keys = JSON.parse(content)
  const key = keys.installed || keys.web
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  })
  
  // Đảm bảo thư mục tồn tại
  await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true })
  await fs.writeFile(TOKEN_PATH, payload)
}

/**
 * Mở trình duyệt để xin quyền, sau đó lưu lại token.
 */
export async function authorizeUser() {
  try {
    await fs.access(CREDENTIALS_PATH)
  } catch {
    console.error(`Không tìm thấy file ${CREDENTIALS_PATH}.`)
    console.error('Vui lòng tạo OAuth 2.0 Client ID (loại Desktop App) trên Google Cloud Console, tải về đổi tên thành credentials.json và đặt vào thư mục này.')
    process.exit(1)
  }

  let client = await loadSavedCredentialsIfExist()
  if (client) {
    return client
  }
  
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  })
  if (client.credentials) {
    await saveCredentials(client)
  }
  return client
}

/**
 * Lấy client đã xác thực cho server (không mở trình duyệt, trả về lỗi nếu chưa xác thực)
 */
export async function getAuthenticatedClient() {
  const client = await loadSavedCredentialsIfExist()
  if (!client) {
    throw new Error('Chưa đăng nhập Google. Hãy chạy "node google_login.mjs" trước.')
  }
  return client
}
