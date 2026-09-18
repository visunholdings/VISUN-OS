-- 0011_fix_calendar_rls_and_rpc_rowcount.sql
-- Hai lỗi thật phát hiện khi rà soát lại toàn bộ code (không phải khi test 43 kịch bản trước đó):
--
-- 1) calendar_events được tạo ở 0005 nhưng 0006 quên bật RLS cho bảng này (không nằm trong bất kỳ nhóm nào).
--    Hậu quả: mọi user đã đăng nhập có thể đọc/ghi calendar_events của MỌI workspace khác, không chỉ của mình.
--
-- 2) rpc_task_complete/rpc_inbox_convert không kiểm tra UPDATE có thực sự ảnh hưởng dòng nào không trước khi
--    trả "success". Postgres RLS chặn UPDATE bằng cách âm thầm khớp 0 dòng (không ném lỗi, khác với INSERT),
--    nên một viewer/member không có quyền sửa gọi các hàm này có thể nhận "success" giả dù RLS đã chặn ghi.

-- ===== Fix 1: RLS cho calendar_events =====
alter table public.calendar_events enable row level security;

create policy calendar_events_select on public.calendar_events
  for select using (public.is_workspace_member(workspace_id));

create policy calendar_events_write on public.calendar_events
  for all using (
    public.current_role_in_workspace(workspace_id) = 'owner'
    or exists (
      select 1 from public.calendar_connections cc
      where cc.id = calendar_events.connection_id and cc.user_id = auth.uid()
    )
  )
  with check (
    public.current_role_in_workspace(workspace_id) = 'owner'
    or exists (
      select 1 from public.calendar_connections cc
      where cc.id = calendar_events.connection_id and cc.user_id = auth.uid()
    )
  );

-- ===== Fix 2: kiểm tra rows affected trong hai hàm RPC =====

create or replace function public.rpc_inbox_convert(
  p_workspace_id uuid,
  p_inbox_item_id uuid,
  p_targets jsonb,
  p_request_id uuid
) returns jsonb
language plpgsql
as $$
declare
  v_target jsonb;
  v_payload jsonb;
  v_new_id uuid;
  v_created jsonb := '[]'::jsonb;
  v_existing jsonb;
  v_actor uuid := auth.uid();
  v_row_count integer;
begin
  if v_actor is null then
    return jsonb_build_object('status','forbidden','message','Cần đăng nhập trước khi thao tác.');
  end if;

  select response_snapshot into v_existing
  from public.idempotency_keys
  where workspace_id = p_workspace_id and scope = 'inbox.convert' and request_key = p_request_id::text;
  if v_existing is not null then
    return v_existing;
  end if;

  if not exists (select 1 from public.inbox_items where id = p_inbox_item_id and workspace_id = p_workspace_id) then
    return jsonb_build_object('status','validation_error','message','inbox_item không tồn tại trong workspace');
  end if;

  for v_target in select * from jsonb_array_elements(coalesce(p_targets,'[]'::jsonb))
  loop
    v_payload := coalesce(v_target->'payload','{}'::jsonb);
    case v_target->>'type'
      when 'task' then
        insert into public.tasks (
          workspace_id, title, description, due_at, customer_id, opportunity_id, project_id,
          assignee_id, source_inbox_id, created_by
        ) values (
          p_workspace_id,
          coalesce(v_payload->>'title',''),
          coalesce(v_payload->>'description',''),
          nullif(v_payload->>'dueAt','')::date,
          nullif(v_payload->>'customerId','')::uuid,
          nullif(v_payload->>'opportunityId','')::uuid,
          nullif(v_payload->>'projectId','')::uuid,
          coalesce(nullif(v_payload->>'assigneeId','')::uuid, v_actor),
          p_inbox_item_id,
          v_actor
        ) returning id into v_new_id;
      when 'note' then
        insert into public.notes (
          workspace_id, title, content, type, customer_id, opportunity_id, project_id, source_inbox_id, created_by
        ) values (
          p_workspace_id,
          coalesce(v_payload->>'title',''),
          coalesce(v_payload->>'content',''),
          coalesce(v_payload->>'noteType','update'),
          nullif(v_payload->>'customerId','')::uuid,
          nullif(v_payload->>'opportunityId','')::uuid,
          nullif(v_payload->>'projectId','')::uuid,
          p_inbox_item_id,
          v_actor
        ) returning id into v_new_id;
      when 'opportunity' then
        insert into public.opportunities (
          workspace_id, customer_id, customer_type, title, stage, owner_id, created_by
        ) values (
          p_workspace_id,
          (v_payload->>'customerId')::uuid,
          coalesce(v_payload->>'customerType','B2B'),
          coalesce(v_payload->>'title',''),
          v_payload->>'stage',
          coalesce(nullif(v_payload->>'ownerId','')::uuid, v_actor),
          v_actor
        ) returning id into v_new_id;
      when 'content' then
        insert into public.content_items (
          workspace_id, title, audience, pillar, source_type, inbox_id, created_by
        ) values (
          p_workspace_id,
          coalesce(v_payload->>'title',''),
          coalesce(v_payload->>'audience','B2B'),
          coalesce(v_payload->>'pillar','qa'),
          'inbox',
          p_inbox_item_id,
          v_actor
        ) returning id into v_new_id;
      else
        return jsonb_build_object('status','validation_error','message', format('target_type "%s" không hợp lệ', v_target->>'type'));
    end case;

    insert into public.inbox_item_targets (workspace_id, inbox_item_id, target_type, target_id, conversion_request_id)
    values (p_workspace_id, p_inbox_item_id, v_target->>'type', v_new_id, p_request_id);

    v_created := v_created || jsonb_build_object('type', v_target->>'type', 'id', v_new_id);
  end loop;

  update public.inbox_items set status = 'processed' where id = p_inbox_item_id and workspace_id = p_workspace_id;
  get diagnostics v_row_count = row_count;
  if v_row_count = 0 then
    return jsonb_build_object('status','forbidden','message','Bạn không có quyền cập nhật Hộp ghi nhanh này.');
  end if;

  v_existing := jsonb_build_object('status','success','inboxItemId', p_inbox_item_id, 'createdTargets', v_created);

  insert into public.idempotency_keys (workspace_id, scope, request_key, response_snapshot)
  values (p_workspace_id, 'inbox.convert', p_request_id::text, v_existing)
  on conflict (workspace_id, scope, request_key) do nothing;

  return v_existing;
end;
$$;

create or replace function public.rpc_task_complete(
  p_workspace_id uuid,
  p_task_id uuid,
  p_revision integer,
  p_request_id uuid
) returns jsonb
language plpgsql
as $$
declare
  v_task public.tasks%rowtype;
  v_series public.task_recurrence_series%rowtype;
  v_interval interval;
  v_next_id uuid;
  v_next_due date;
  v_result jsonb;
  v_existing jsonb;
  v_row_count integer;
begin
  if auth.uid() is null then
    return jsonb_build_object('status','forbidden','message','Cần đăng nhập trước khi thao tác.');
  end if;

  select response_snapshot into v_existing
  from public.idempotency_keys
  where workspace_id = p_workspace_id and scope = 'task.complete' and request_key = p_request_id::text;
  if v_existing is not null then
    return v_existing;
  end if;

  select * into v_task from public.tasks where id = p_task_id and workspace_id = p_workspace_id;
  if not found then
    return jsonb_build_object('status','validation_error','message','Task không tồn tại trong workspace');
  end if;
  if v_task.revision is distinct from p_revision then
    return jsonb_build_object('status','conflict','message','Task đã bị người khác sửa; tải lại trước khi hoàn thành');
  end if;

  update public.tasks set status = 'done' where id = p_task_id;
  get diagnostics v_row_count = row_count;
  if v_row_count = 0 then
    return jsonb_build_object('status','forbidden','message','Bạn không có quyền hoàn thành việc này.');
  end if;

  if v_task.recurring_series_id is not null and v_task.due_at is not null then
    select * into v_series from public.task_recurrence_series where id = v_task.recurring_series_id and active;
    if found then
      v_interval := case v_series.recurrence when 'daily' then interval '1 day' else interval '7 days' end;
      v_next_due := v_task.due_at + v_interval;
      if not exists (
        select 1 from public.tasks
        where recurring_series_id = v_task.recurring_series_id and due_at = v_next_due
      ) then
        insert into public.tasks (
          workspace_id, title, description, status, priority, due_at,
          customer_id, opportunity_id, project_id, assignee_id, promised_to,
          recurring_series_id, created_by
        ) values (
          p_workspace_id, v_task.title, v_task.description, 'todo', v_task.priority, v_next_due,
          v_task.customer_id, v_task.opportunity_id, v_task.project_id, v_task.assignee_id, v_task.promised_to,
          v_task.recurring_series_id, v_task.created_by
        ) returning id into v_next_id;
      end if;
    end if;
  end if;

  v_result := jsonb_build_object(
    'status','success',
    'task', jsonb_build_object('id', p_task_id, 'status','done'),
    'nextOccurrence', case when v_next_id is not null
      then jsonb_build_object('id', v_next_id, 'dueAt', v_next_due)
      else null end
  );

  insert into public.idempotency_keys (workspace_id, scope, request_key, response_snapshot)
  values (p_workspace_id, 'task.complete', p_request_id::text, v_result)
  on conflict (workspace_id, scope, request_key) do nothing;

  return v_result;
end;
$$;
