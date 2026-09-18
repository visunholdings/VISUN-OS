-- 0008_tighten_anon_permissions.sql
-- Supabase mặc định cấp EXECUTE cho cả "anon" lẫn "authenticated" trên hàm mới tạo trong schema public,
-- không đi qua PUBLIC pseudo-role — nên "revoke ... from public" ở các migration trước không đủ để chặn anon.
-- Dữ liệu vẫn an toàn vì Row Level Security (0006) chặn đúng ở tầng bảng bất kể ai gọi hàm, đã xác nhận:
-- gọi rpc_task_complete bằng anon chỉ trả "Task không tồn tại" chứ không đọc được dữ liệu thật.
-- Migration này chỉ siết thêm một lớp: anon không gọi được các lệnh ghi nữa, tránh lỗi gây hiểu nhầm.

revoke execute on function public.create_workspace(text) from anon;
revoke execute on function public.rpc_inbox_convert(uuid,uuid,jsonb,uuid) from anon;
revoke execute on function public.rpc_task_complete(uuid,uuid,integer,uuid) from anon;
revoke execute on function public.rpc_opportunity_create_project(uuid,uuid,jsonb,uuid) from anon;

-- Áp dụng cho các hàm ghi dữ liệu tạo sau này trong schema public: mặc định không cấp EXECUTE cho anon nữa,
-- phải cấp thủ công (grant ... to authenticated) như 0001/0007 đã làm nếu một hàm mới cần được authenticated gọi.
alter default privileges in schema public revoke execute on functions from anon;
