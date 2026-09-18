-- 0001_foundations.sql
-- Nền tảng: extensions, workspaces, membership, chia sẻ theo hồ sơ, hàm dùng chung cho RLS và trigger.
-- Áp dụng trên Supabase thật: schema "auth" và auth.uid() do nền tảng cung cấp sẵn, KHÔNG tự tạo lại ở đây.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- authenticated/anon cần quyền USAGE trên schema "extensions" thì mới gọi được hàm/operator class bên trong,
-- kể cả khi gọi qua một hàm public khác (f_unaccent) hay qua index (gin_trgm_ops).
grant usage on schema extensions to authenticated, anon;

-- Supabase cài các extension trên vào schema "extensions", không phải "public", nên hàm gọi chúng phải tự thêm
-- "extensions" vào search_path của chính hàm — không phụ thuộc search_path của phiên gọi nó.
-- unaccent() mặc định không IMMUTABLE nên không dùng trực tiếp trong index; bọc lại bản IMMUTABLE để tạo GIN index tìm tiếng Việt có/không dấu.
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
set search_path = public, extensions
as $$
  select unaccent('unaccent', $1)
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member','viewer')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  unique (workspace_id, user_id)
);

create table if not exists public.resource_shares (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  resource_type text not null,
  resource_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null check (permission in ('view','edit')),
  granted_by uuid not null references auth.users(id),
  granted_at timestamptz not null default now(),
  unique (workspace_id, resource_type, resource_id, user_id)
);

-- ===== Hàm dùng chung cho RLS =====

create or replace function public.current_role_in_workspace(p_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.memberships m
  where m.workspace_id = p_workspace_id
    and m.user_id = auth.uid()
    and m.revoked_at is null
  limit 1
$$;

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
      and m.revoked_at is null
  )
$$;

create or replace function public.has_resource_access(p_workspace_id uuid, p_resource_type text, p_resource_id uuid, p_min_permission text default 'view')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.resource_shares rs
    where rs.workspace_id = p_workspace_id
      and rs.resource_type = p_resource_type
      and rs.resource_id = p_resource_id
      and rs.user_id = auth.uid()
      and (p_min_permission = 'view' or rs.permission = 'edit')
  )
$$;

-- ===== Bootstrap tạo workspace =====
-- Vòng "trứng-gà": chưa có membership thì không ai qua được policy insert của bảng memberships.
-- Hàm security definer này chạy với quyền chủ sở hữu hàm (postgres, có BYPASSRLS trên Supabase) để tạo workspace + membership owner đầu tiên.
create or replace function public.create_workspace(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  insert into public.workspaces (name, created_by) values (p_name, auth.uid()) returning id into v_workspace_id;
  insert into public.memberships (workspace_id, user_id, role, accepted_at) values (v_workspace_id, auth.uid(), 'owner', now());
  return v_workspace_id;
end;
$$;

revoke all on function public.create_workspace(text) from public;
grant execute on function public.create_workspace(text) to authenticated;

-- ===== Trigger dùng chung =====

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.bump_revision()
returns trigger
language plpgsql
as $$
begin
  new.revision = coalesce(old.revision, 1) + 1;
  return new;
end;
$$;

-- Chặn client tự đổi workspace_id/created_by/created_at khi update (chỉ server function mới được sửa qua đường khác nếu cần).
create or replace function public.protect_ownership_columns()
returns trigger
language plpgsql
as $$
begin
  new.workspace_id = old.workspace_id;
  new.created_by = old.created_by;
  new.created_at = old.created_at;
  return new;
end;
$$;
