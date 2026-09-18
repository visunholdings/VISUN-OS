-- 0006_triggers_and_rls.sql
-- Áp trigger updated_at/revision và Row Level Security theo ma trận quyền ở docs/BACKEND_CONTRACT.md.
-- Dùng vòng lặp DO để tránh lặp lại cùng một mẫu chính sách hàng chục lần.

-- ===== Trigger cho bảng nghiệp vụ chính (đủ cột nền: workspace_id/created_by/created_at/revision) =====
do $$
declare
  t text;
  core_tables text[] := array[
    'customers','opportunities','projects','tasks','notes','inbox_items',
    'learning_items','knowledge_items','data_assets','content_items'
  ];
begin
  foreach t in array core_tables loop
    execute format('drop trigger if exists trg_updated_at on public.%I', t);
    execute format('create trigger trg_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
    execute format('drop trigger if exists trg_bump_revision on public.%I', t);
    execute format('create trigger trg_bump_revision before update on public.%I for each row execute function public.bump_revision()', t);
    execute format('drop trigger if exists trg_protect_ownership on public.%I', t);
    execute format('create trigger trg_protect_ownership before update on public.%I for each row execute function public.protect_ownership_columns()', t);
  end loop;
end $$;

-- updated_at cho vài bảng không có cột revision.
do $$
declare
  t text;
  updated_only_tables text[] := array['calendar_events','content_publications','contacts','milestones'];
begin
  foreach t in array updated_only_tables loop
    execute format('drop trigger if exists trg_updated_at on public.%I', t);
    execute format('create trigger trg_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ===== Kiểm tra đích của inbox_item_targets tồn tại đúng bảng tương ứng (mục 3.1 kế hoạch backend) =====
create or replace function public.validate_inbox_target()
returns trigger
language plpgsql
as $$
begin
  case new.target_type
    when 'task' then
      if not exists (select 1 from public.tasks where id = new.target_id and workspace_id = new.workspace_id) then
        raise exception 'target task % không tồn tại trong workspace', new.target_id;
      end if;
    when 'note' then
      if not exists (select 1 from public.notes where id = new.target_id and workspace_id = new.workspace_id) then
        raise exception 'target note % không tồn tại trong workspace', new.target_id;
      end if;
    when 'opportunity' then
      if not exists (select 1 from public.opportunities where id = new.target_id and workspace_id = new.workspace_id) then
        raise exception 'target opportunity % không tồn tại trong workspace', new.target_id;
      end if;
    when 'content' then
      if not exists (select 1 from public.content_items where id = new.target_id and workspace_id = new.workspace_id) then
        raise exception 'target content % không tồn tại trong workspace', new.target_id;
      end if;
  end case;
  return new;
end;
$$;

create trigger trg_validate_inbox_target
  before insert on public.inbox_item_targets
  for each row execute function public.validate_inbox_target();

-- ============================================================
-- Row Level Security
-- Ghi chú chung: chính sách dưới đây là MẶC ĐỊNH ĐỀ XUẤT cho BE0 (mục "Ma trận quyền theo vai trò" trong
-- docs/BACKEND_CONTRACT.md). Anh Hùng xác nhận hoặc chỉnh mức quyền của "member" trước khi dùng dữ liệu thật.
-- ============================================================

-- Nhóm 1: bảng nghiệp vụ chính có đủ created_by + revision -> áp chính sách chi tiết owner/member/viewer + resource_shares.
do $$
declare
  t text;
  core_tables text[] := array[
    'customers','opportunities','projects','tasks','notes','inbox_items',
    'learning_items','knowledge_items','data_assets','content_items'
  ];
begin
  foreach t in array core_tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists ws_select on public.%I', t);
    execute format('create policy ws_select on public.%I for select using (public.is_workspace_member(workspace_id))', t);

    execute format('drop policy if exists ws_insert on public.%I', t);
    execute format('create policy ws_insert on public.%I for insert with check (public.current_role_in_workspace(workspace_id) in (''owner'',''member''))', t);

    execute format('drop policy if exists ws_update on public.%I', t);
    execute format(
      'create policy ws_update on public.%I for update using (
         public.current_role_in_workspace(workspace_id) = ''owner''
         or (public.current_role_in_workspace(workspace_id) = ''member'' and created_by = auth.uid())
         or public.has_resource_access(workspace_id, %L, id, ''edit'')
       )', t, t);

    execute format('drop policy if exists ws_delete on public.%I', t);
    execute format('create policy ws_delete on public.%I for delete using (public.current_role_in_workspace(workspace_id) = ''owner'')', t);
  end loop;
end $$;

-- Nhóm 2: bảng phụ thuộc/cấu hình -- mọi thành viên đang hoạt động (owner/member) được tạo/sửa, viewer chỉ đọc.
-- Đây là mặc định THÔ cho BE0; thu hẹp theo quyền của bảng cha (ví dụ theo resource_shares của project/customer) khi rà ở BE1.
do $$
declare
  t text;
  child_tables text[] := array[
    'contacts','milestones','project_documents','documents',
    'task_recurrence_series','inbox_item_targets',
    'content_publications','content_metric_snapshots',
    'research_sources','research_settings','research_runs','research_proposals',
    'calendar_selected_calendars',
    'ai_conversations','ai_messages','ai_proposals','ai_proposal_items',
    'notifications','reminder_settings','idempotency_keys'
  ];
begin
  foreach t in array child_tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists ws_select on public.%I', t);
    execute format('create policy ws_select on public.%I for select using (public.is_workspace_member(workspace_id))', t);

    execute format('drop policy if exists ws_write on public.%I', t);
    execute format(
      'create policy ws_write on public.%I for all using (public.current_role_in_workspace(workspace_id) in (''owner'',''member''))
       with check (public.current_role_in_workspace(workspace_id) in (''owner'',''member''))', t);
  end loop;
end $$;

-- Nhóm 3: chỉ chủ sở hữu (owner) đọc/ghi -- dữ liệu vận hành, nhạy cảm hoặc cần phê duyệt tường minh (cột P trong ma trận quyền).
do $$
declare
  t text;
  owner_only_tables text[] := array[
    'pipeline_stages','audit_logs','export_jobs','import_jobs',
    'ai_commit_log','resource_shares','reminder_deliveries'
  ];
begin
  foreach t in array owner_only_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists owner_all on public.%I', t);
    execute format(
      'create policy owner_all on public.%I for all using (public.current_role_in_workspace(workspace_id) = ''owner'')
       with check (public.current_role_in_workspace(workspace_id) = ''owner'')', t);
  end loop;
end $$;

-- Người nhận vẫn xem được thông báo/lịch nhắc của chính mình dù không phải owner.
create policy self_select_reminder_deliveries on public.reminder_deliveries for select using (user_id = auth.uid());

-- calendar_connections: theo ma trận quyền, mỗi người chỉ quản lý kết nối của chính mình; owner thấy toàn bộ.
alter table public.calendar_connections enable row level security;
create policy calendar_connections_select on public.calendar_connections
  for select using (public.is_workspace_member(workspace_id));
create policy calendar_connections_write on public.calendar_connections
  for all using (public.current_role_in_workspace(workspace_id) = 'owner' or user_id = auth.uid())
  with check (public.current_role_in_workspace(workspace_id) = 'owner' or user_id = auth.uid());

-- workspaces và memberships: chính sách riêng, không dùng vòng lặp chung vì không có cột workspace_id trên chính nó.
alter table public.workspaces enable row level security;
create policy workspaces_select on public.workspaces for select using (public.is_workspace_member(id));
create policy workspaces_update on public.workspaces for update using (public.current_role_in_workspace(id) = 'owner');

alter table public.memberships enable row level security;
create policy memberships_select on public.memberships for select using (public.is_workspace_member(workspace_id));
create policy memberships_write on public.memberships for all
  using (public.current_role_in_workspace(workspace_id) = 'owner')
  with check (public.current_role_in_workspace(workspace_id) = 'owner');
