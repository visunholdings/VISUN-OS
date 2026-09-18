-- 0003_projects_tasks_notes_inbox.sql
-- Dự án/mốc/tài liệu, task/ghi chú, hộp ghi nhanh và inbox_item_targets (một nguồn -> nhiều đích, mục 3.1 kế hoạch backend).

-- Đảm bảo phiên chạy migration này thấy schema "extensions" (unaccent/pg_trgm) khi tạo index tìm kiếm bên dưới.
set search_path = public, extensions;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  title text not null,
  type text not null default '',
  status text not null check (status in ('planning','active','waiting','done')) default 'planning',
  objective text not null default '',
  next_milestone_at date,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  revision integer not null default 1
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  date date not null,
  status text not null check (status in ('todo','done')) default 'todo',
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  url text not null,
  added_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_type text not null check (owner_type in ('project','customer','opportunity','knowledge','data_asset')),
  owner_id uuid not null,
  filename text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.task_recurrence_series (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  recurrence text not null check (recurrence in ('daily','weekly')),
  anchor_date date not null,
  template jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null check (status in ('todo','doing','waiting','done','cancelled')) default 'todo',
  priority text not null check (priority in ('low','medium','high')) default 'medium',
  due_at date,
  review_at date,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  customer_id uuid references public.customers(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  source_note_id uuid,
  source_inbox_id uuid,
  assignee_id uuid not null references auth.users(id),
  promised_to text,
  recurring_series_id uuid references public.task_recurrence_series(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  revision integer not null default 1,
  constraint chk_task_waiting_requires_review check (status <> 'waiting' or review_at is not null)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  content text not null default '',
  type text not null check (type in ('call','meeting','idea','decision','update')),
  customer_id uuid references public.customers(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  source_inbox_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  revision integer not null default 1
);

alter table public.tasks add constraint fk_tasks_source_note foreign key (source_note_id) references public.notes(id) on delete set null;

create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content text not null,
  status text not null check (status in ('new','processed','dismissed')) default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  revision integer not null default 1
);

alter table public.tasks add constraint fk_tasks_source_inbox foreign key (source_inbox_id) references public.inbox_items(id) on delete set null;
alter table public.notes add constraint fk_notes_source_inbox foreign key (source_inbox_id) references public.inbox_items(id) on delete set null;

create table if not exists public.inbox_item_targets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  inbox_item_id uuid not null references public.inbox_items(id) on delete cascade,
  target_type text not null check (target_type in ('task','note','opportunity','content')),
  target_id uuid not null,
  conversion_request_id uuid not null,
  created_at timestamptz not null default now(),
  unique (inbox_item_id, target_type, target_id)
);

create index if not exists idx_tasks_workspace_status_due on public.tasks (workspace_id, status, due_at);
create index if not exists idx_tasks_review_at on public.tasks (workspace_id, review_at) where status = 'waiting';
create index if not exists idx_tasks_assignee on public.tasks (assignee_id, status);
create index if not exists idx_tasks_search on public.tasks using gin (f_unaccent(lower(title || ' ' || description)) gin_trgm_ops);
create index if not exists idx_notes_search on public.notes using gin (f_unaccent(lower(title || ' ' || content)) gin_trgm_ops);
create index if not exists idx_inbox_items_workspace_status on public.inbox_items (workspace_id, status);
create index if not exists idx_inbox_targets_by_item on public.inbox_item_targets (inbox_item_id);
