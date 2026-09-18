// URL và anon key của project Supabase thật — đây là giá trị công khai, an toàn (được bảo vệ bằng Row Level
// Security ở visun-os-backend/supabase/migrations, không phải bí mật như service_role key).
// Có thể ghi đè bằng biến môi trường SUPABASE_URL/SUPABASE_ANON_KEY nếu sau này đổi project.
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jwbqildqygofpsfkgavw.supabase.co'
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YnFpbGRxeWdvZnBzZmtnYXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3Mjg3OTksImV4cCI6MjEwNTMwNDc5OX0.8fCZtMeapxdlwuoPfaHGGzrfMnPNiHBFe0u2fxDU2SY'

// Cổng local dùng để nhận link đăng nhập quay về khi chạy login.mjs — phải khớp với URL được thêm vào
// Supabase Dashboard → Authentication → URL Configuration → Redirect URLs (xem README.md).
export const LOGIN_CALLBACK_PORT = 51739
