// Mã hóa/giải mã access_token, refresh_token của Google trước khi lưu vào calendar_connections,
// dùng AES-256-GCM qua Web Crypto API có sẵn trong Deno (runtime của Supabase Edge Functions).
// Khóa lấy từ biến môi trường TOKEN_ENCRYPTION_KEY (chuỗi hex 64 ký tự = 32 byte).

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  return bytes
}

async function getKey(): Promise<CryptoKey> {
  const hex = Deno.env.get('TOKEN_ENCRYPTION_KEY')
  if (!hex || hex.length !== 64) {
    throw new Error('Thiếu hoặc sai định dạng TOKEN_ENCRYPTION_KEY (cần chuỗi hex 64 ký tự = 32 byte).')
  }
  return crypto.subtle.importKey('raw', hexToBytes(hex), 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptToken(payload: string): Promise<string> {
  const key = await getKey()
  const combined = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
