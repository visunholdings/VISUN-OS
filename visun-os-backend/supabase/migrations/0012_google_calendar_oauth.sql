-- 0012_google_calendar_oauth.sql
-- Hỗ trợ nút "Kết nối Google Calendar" thật trong web app (BE4).
--
-- Vấn đề cần giải quyết: khi Google chuyển hướng trình duyệt về Edge Function sau khi người dùng đồng ý
-- cấp quyền, request đó KHÔNG mang theo phiên đăng nhập Supabase (không có JWT) — chỉ có "code" và "state".
-- Giải pháp: khi người dùng bấm "Kết nối" (lúc đó vẫn đang đăng nhập bình thường), gọi rpc_google_oauth_start
-- để ghi một dòng "state" tạm gắn với đúng workspace/người dùng đó; Edge Function xử lý callback tra lại
-- dòng này bằng service_role (buộc phải dùng vì không có JWT của người dùng ở bước callback), dùng xong xóa
-- ngay để không tái sử dụng được.

create table if not exists public.oauth_pending_connections (
  state uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.oauth_pending_connections enable row level security;
-- Chỉ owner/member được khởi tạo state của chính workspace mình (kiểm tra qua current_role_in_workspace).
-- Không có policy select/delete cho client thường — chỉ Edge Function (service_role) mới đọc/xóa được,
-- vì service_role luôn bypass RLS.
create policy oauth_pending_insert on public.oauth_pending_connections
  for insert with check (public.current_role_in_workspace(workspace_id) in ('owner','member'));

create or replace function public.rpc_google_oauth_start(p_workspace_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_state uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Cần đăng nhập trước khi kết nối Google.';
  end if;
  -- Tự sinh state trước rồi insert giá trị tường minh (không dùng RETURNING): bảng này cố tình không có
  -- policy SELECT (chỉ Edge Function bằng service_role mới cần đọc), và INSERT ... RETURNING trên Postgres
  -- cần chính sách SELECT để trả lại dòng vừa tạo — thiếu policy đó sẽ khiến RETURNING bị RLS chặn dù
  -- chính WITH CHECK của INSERT hợp lệ. Sinh UUID ở client (hàm) rồi trả thẳng, không cần đọc lại từ bảng.
  insert into public.oauth_pending_connections (state, workspace_id, user_id)
  values (v_state, p_workspace_id, auth.uid());

  return v_state;
end;
$$;

grant execute on function public.rpc_google_oauth_start(uuid) to authenticated;

-- Một người dùng chỉ có một kết nối Google Calendar cho mỗi workspace; kết nối lại sẽ ghi đè (upsert)
-- thay vì tạo thêm dòng mới, tránh calendar_events đồng bộ trùng qua hai connection_id khác nhau.
alter table public.calendar_connections
  add constraint uq_calendar_connections_workspace_user unique (workspace_id, user_id);
