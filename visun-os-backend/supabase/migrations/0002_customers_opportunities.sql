-- 0002_customers_opportunities.sql
-- Khách hàng, người liên hệ, pipeline cơ hội theo bảng ERD ở docs/BACKEND_CONTRACT.md.

-- Sửa lại cho đúng: đảm bảo phiên chạy migration này nhìn thấy schema "extensions" (nơi Supabase cài
-- unaccent/pg_trgm) khi tạo index bên dưới, và vá lại f_unaccent trên database đã chạy 0001 trước đó.
set search_path = public, extensions;

create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
set search_path = public, extensions
as $$
  select unaccent('unaccent', $1)
$$;

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_type text not null check (customer_type in ('B2C','B2B')),
  stage_key text not null,
  label text not null,
  sort_order integer not null default 0,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  unique (workspace_id, customer_type, stage_key)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null check (type in ('B2C','B2B')),
  name text not null,
  contact_name text not null default '',
  channel text not null default '',
  need text not null default '',
  status text not null default '',
  next_contact_at date,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  revision integer not null default 1
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  role text not null default '',
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  customer_type text not null check (customer_type in ('B2C','B2B')),
  title text not null,
  product text not null default '',
  stage text not null,
  next_action text not null default '',
  next_action_at date,
  owner_id uuid not null references auth.users(id),
  value numeric,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  revision integer not null default 1
);

-- Chặn ghi giai đoạn không có trong pipeline_stages của đúng workspace/loại khách (mục 2.2 kế hoạch backend: chốt bộ giai đoạn theo cấu hình workspace).
create or replace function public.validate_opportunity_stage()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.pipeline_stages ps
    where ps.workspace_id = new.workspace_id
      and ps.customer_type = new.customer_type
      and ps.stage_key = new.stage
  ) then
    raise exception 'Giai đoạn "%" chưa được cấu hình cho workspace % / %', new.stage, new.workspace_id, new.customer_type;
  end if;
  return new;
end;
$$;

create trigger trg_validate_opportunity_stage
  before insert or update of stage, customer_type, workspace_id on public.opportunities
  for each row execute function public.validate_opportunity_stage();

create index if not exists idx_customers_search on public.customers
  using gin (f_unaccent(lower(name || ' ' || coalesce(contact_name,'') || ' ' || coalesce(need,''))) gin_trgm_ops);
create index if not exists idx_customers_workspace_type on public.customers (workspace_id, type);
create index if not exists idx_opportunities_workspace_stage on public.opportunities (workspace_id, stage);
create index if not exists idx_opportunities_customer on public.opportunities (customer_id);
