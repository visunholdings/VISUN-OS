-- 0007_server_operations.sql
-- Ba lệnh máy chủ quan trọng nhất của "luồng chứng minh đầu tiên" (mục 1, KE_HOACH_BACKEND_VISUN_OS.md):
-- inbox.convert, task.complete, opportunity.createProject.
--
-- Viết dưới dạng hàm Postgres (RPC gọi qua supabase.rpc(...)) thay vì Edge Function orchestration nhiều bước,
-- vì một lệnh gọi hàm là MỘT giao dịch nguyên tử theo đúng nghĩa Postgres: nếu bất kỳ câu lệnh nào bên trong
-- lỗi, toàn bộ thay đổi của lần gọi đó tự rollback. Hàm chạy "security invoker" (mặc định) nên toàn bộ
-- INSERT/UPDATE bên trong vẫn bị Row Level Security ở migration 0006 kiểm tra như một client bình thường —
-- không có đường tắt bỏ qua quyền. Idempotency dựa vào bảng idempotency_keys + request_id do client sinh.

create or replace function public.rpc_inbox_convert(
  p_workspace_id uuid,
  p_inbox_item_id uuid,
  p_targets jsonb, -- [{"type":"task"|"note"|"opportunity"|"content", "payload": {...}}]
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
begin
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
begin
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

create or replace function public.rpc_opportunity_create_project(
  p_workspace_id uuid,
  p_opportunity_id uuid,
  p_project_draft jsonb,
  p_request_id uuid
) returns jsonb
language plpgsql
as $$
declare
  v_opp public.opportunities%rowtype;
  v_stage public.pipeline_stages%rowtype;
  v_project_id uuid;
  v_existing jsonb;
  v_actor uuid := auth.uid();
begin
  select response_snapshot into v_existing
  from public.idempotency_keys
  where workspace_id = p_workspace_id and scope = 'opportunity.createProject' and request_key = p_request_id::text;
  if v_existing is not null then
    return v_existing;
  end if;

  select * into v_opp from public.opportunities where id = p_opportunity_id and workspace_id = p_workspace_id;
  if not found then
    return jsonb_build_object('status','validation_error','message','Cơ hội không tồn tại trong workspace');
  end if;

  select * into v_stage from public.pipeline_stages
  where workspace_id = p_workspace_id and customer_type = v_opp.customer_type and stage_key = v_opp.stage;
  if not found or not v_stage.is_won then
    return jsonb_build_object('status','validation_error','message','Cơ hội chưa ở giai đoạn đã chốt (is_won)');
  end if;

  select id into v_project_id from public.projects
  where opportunity_id = p_opportunity_id and workspace_id = p_workspace_id
  limit 1;

  if v_project_id is null then
    insert into public.projects (workspace_id, customer_id, opportunity_id, title, type, objective, owner_id, created_by)
    values (
      p_workspace_id, v_opp.customer_id, p_opportunity_id,
      coalesce(p_project_draft->>'title', v_opp.title),
      coalesce(p_project_draft->>'type', v_opp.product),
      coalesce(p_project_draft->>'objective', v_opp.next_action),
      v_actor, v_actor
    ) returning id into v_project_id;
  end if;

  v_existing := jsonb_build_object('status','success','projectId', v_project_id);

  insert into public.idempotency_keys (workspace_id, scope, request_key, response_snapshot)
  values (p_workspace_id, 'opportunity.createProject', p_request_id::text, v_existing)
  on conflict (workspace_id, scope, request_key) do nothing;

  return v_existing;
end;
$$;

grant execute on function public.rpc_inbox_convert(uuid,uuid,jsonb,uuid) to authenticated;
grant execute on function public.rpc_task_complete(uuid,uuid,integer,uuid) to authenticated;
grant execute on function public.rpc_opportunity_create_project(uuid,uuid,jsonb,uuid) to authenticated;
