-- 0005_calendar_ai_ops.sql
-- Lịch Google, hội thoại/đề xuất AI, và bảng vận hành (audit, nhắc việc, export/import, idempotency).

create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  provider text not null default 'google',
  account_email text,
  scope text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  status text not null check (status in ('connected','expired','revoked')) default 'connected',
  last_synced_at timestamptz,
  sync_cursor text,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_selected_calendars (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  connection_id uuid not null references public.calendar_connections(id) on delete cascade,
  calendar_id text not null,
  calendar_name text,
  visible boolean not null default true,
  unique (connection_id, calendar_id)
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  connection_id uuid not null references public.calendar_connections(id) on delete cascade,
  external_event_id text not null,
  calendar_id text not null,
  title text not null default '',
  start timestamptz not null,
  "end" timestamptz not null,
  all_day boolean not null default false,
  cancelled boolean not null default false,
  customer_id uuid references public.customers(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, external_event_id)
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  title text,
  screen_context text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  source_label text not null default '',
  status text not null check (status in ('pending','committed','discarded')) default 'pending',
  model text,
  model_version text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_proposal_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  proposal_id uuid not null references public.ai_proposals(id) on delete cascade,
  action text not null check (action in ('create','update')),
  record_type text not null,
  record_id uuid,
  before jsonb,
  after jsonb not null,
  included boolean not null default true,
  validation_error text
);

create table if not exists public.ai_commit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  proposal_id uuid not null references public.ai_proposals(id) on delete cascade,
  operation_id uuid not null unique,
  approver_id uuid not null references auth.users(id),
  committed_at timestamptz not null default now(),
  result jsonb not null
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  source text not null check (source in ('user','ai','system','import')) default 'user',
  operation_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  reminder_time time not null default '07:30',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  weekdays_only boolean not null default false,
  unique (workspace_id, user_id)
);

create table if not exists public.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  for_date date not null,
  status text not null check (status in ('queued','sent','failed')) default 'queued',
  sent_at timestamptz,
  error text,
  job_run_id uuid,
  unique (workspace_id, user_id, for_date)
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  scope jsonb not null default '{}'::jsonb,
  format text not null check (format in ('csv','json')),
  status text not null check (status in ('queued','running','succeeded','failed')) default 'queued',
  file_url text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  source_type text not null,
  status text not null check (status in ('queued','running','succeeded','failed')) default 'queued',
  stats jsonb not null default '{}'::jsonb,
  error_report_url text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scope text not null,
  request_key text not null,
  request_hash text,
  response_snapshot jsonb,
  created_at timestamptz not null default now(),
  unique (workspace_id, scope, request_key)
);

create index if not exists idx_calendar_events_range on public.calendar_events (workspace_id, start, "end");
create index if not exists idx_audit_logs_entity on public.audit_logs (workspace_id, entity_type, entity_id);
create index if not exists idx_notifications_user on public.notifications (user_id, read_at);
