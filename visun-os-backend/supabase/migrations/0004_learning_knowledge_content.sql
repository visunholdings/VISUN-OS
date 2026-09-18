-- 0004_learning_knowledge_content.sql
-- Học tập, kiến thức, dữ liệu dự án, truyền thông & nội dung, agent nghiên cứu.

-- Đảm bảo phiên chạy migration này thấy schema "extensions" (unaccent/pg_trgm) khi tạo index tìm kiếm bên dưới.
set search_path = public, extensions;

create table if not exists public.learning_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('course','research','tool')),
  status text not null check (status in ('planned','active','paused','done')) default 'planned',
  objective text not null default '',
  notes text not null default '',
  progress integer not null default 0 check (progress between 0 and 100),
  next_action text not null default '',
  next_review_at date,
  source_url text,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  revision integer not null default 1
);

create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  category text not null check (category in ('insight','guide','prompt','template','research')),
  content text not null default '',
  source_url text,
  tags text[] not null default '{}',
  review_status text not null check (review_status in ('draft','reviewed')) default 'draft',
  project_id uuid references public.projects(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  learning_id uuid references public.learning_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  revision integer not null default 1
);

create table if not exists public.data_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('dataset','document','table','link')),
  description text not null default '',
  content text not null default '',
  source_url text,
  format text not null default '',
  review_status text not null check (review_status in ('draft','reviewed')) default 'draft',
  project_id uuid references public.projects(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  revision integer not null default 1
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  angle text not null default '',
  audience text not null check (audience in ('B2C','B2B')),
  pillar text not null check (pillar in ('experience','workflow','guide','research','qa')),
  status text not null check (status in ('idea','selected','draft','review','ready','published')) default 'idea',
  source_type text not null check (source_type in ('manual','inbox','knowledge','research')) default 'manual',
  source_url text,
  source_note text,
  knowledge_id uuid references public.knowledge_items(id) on delete set null,
  inbox_id uuid references public.inbox_items(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  draft text not null default '',
  cta text not null default '',
  evidence text not null check (evidence in ('unchecked','checked','permission_needed')) default 'unchecked',
  next_action text,
  due_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  revision integer not null default 1
);

create table if not exists public.content_publications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  channel text not null check (channel in ('facebook','linkedin','youtube','tiktok')),
  scheduled_at timestamptz,
  published_at timestamptz,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_id, channel)
);

create table if not exists public.content_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_publication_id uuid not null references public.content_publications(id) on delete cascade,
  captured_at timestamptz not null default now(),
  source text not null check (source in ('manual','sync')),
  views integer,
  interactions integer,
  conversations integer,
  created_by uuid not null references auth.users(id)
);

create table if not exists public.research_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  label text not null,
  url text not null,
  type text not null default 'website',
  allowed boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.research_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  topics text[] not null default '{}',
  schedule_cron text,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  enabled boolean not null default false
);

create table if not exists public.research_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('queued','running','succeeded','failed')) default 'queued',
  sources_checked integer not null default 0,
  proposals_created integer not null default 0,
  error text
);

create table if not exists public.research_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  research_run_id uuid not null references public.research_runs(id) on delete cascade,
  url text not null,
  discovered_at timestamptz not null default now(),
  summary text not null default '',
  assessment text not null default '',
  evidence_status text not null default 'unchecked',
  dedupe_key text not null,
  status text not null check (status in ('pending','accepted','dismissed')) default 'pending',
  accepted_content_id uuid references public.content_items(id) on delete set null,
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  unique (workspace_id, dedupe_key)
);

create index if not exists idx_content_items_search on public.content_items
  using gin (f_unaccent(lower(title || ' ' || angle || ' ' || draft)) gin_trgm_ops);
create index if not exists idx_knowledge_items_search on public.knowledge_items
  using gin (f_unaccent(lower(title || ' ' || content)) gin_trgm_ops);
create index if not exists idx_content_items_status on public.content_items (workspace_id, status);
create index if not exists idx_research_proposals_status on public.research_proposals (workspace_id, status);
