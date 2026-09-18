-- 0010_force_created_by_on_insert.sql
-- Lỗi thật gặp phải: frontend gọi Data API insert thẳng vào inbox_items/tasks (không qua hàm RPC) nhưng không
-- gửi created_by, mà cột này not null và không có default -> insert bị từ chối ở tầng database.
-- Đúng nguyên tắc "Backend gán workspace và người tạo từ phiên xác thực, không tin giá trị client gửi"
-- (mục 2.2, KE_HOACH_BACKEND_VISUN_OS.md), sửa bằng trigger ép created_by = auth.uid() khi insert,
-- bất kể client có gửi giá trị gì hay không — vừa sửa lỗi vừa chặn giả mạo người tạo.

create or replace function public.force_created_by()
returns trigger
language plpgsql
as $$
begin
  new.created_by = auth.uid();
  return new;
end;
$$;

do $$
declare
  t text;
  tables_with_created_by text[] := array[
    'customers','opportunities','projects','tasks','notes','inbox_items',
    'learning_items','knowledge_items','data_assets','content_items',
    'contacts','milestones','project_documents','task_recurrence_series',
    'research_sources','ai_proposals'
  ];
begin
  foreach t in array tables_with_created_by loop
    execute format('drop trigger if exists trg_force_created_by on public.%I', t);
    execute format('create trigger trg_force_created_by before insert on public.%I for each row execute function public.force_created_by()', t);
  end loop;
end $$;
