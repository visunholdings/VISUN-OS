import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Chỉ khởi tạo khi có đủ biến môi trường; xem .env.example.
// Chưa cấu hình -> apiRepository không dùng được, app tiếp tục chạy ở chế độ demo (xem src/data/README.md).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isBackendConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isBackendConfigured
  ? createClient(url as string, anonKey as string)
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Chưa cấu hình VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY trong .env')
  return supabase
}
