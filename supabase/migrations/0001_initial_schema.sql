create extension if not exists "pgcrypto";

create type public.workspace_role as enum ('owner', 'admin', 'editor', 'viewer');
create type public.document_type as enum ('canvas', 'text');
create type public.membership_status as enum ('active', 'invited', 'removed');

create table public.profiles (
  id text primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  created_by text not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  status public.membership_status not null default 'active',
  invited_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type public.document_type not null,
  title text not null check (char_length(title) between 1 and 180),
  summary text,
  yjs_state bytea,
  preview jsonb not null default '{}'::jsonb,
  created_by text not null references public.profiles(id) on delete restrict,
  updated_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.document_snapshots (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version bigint not null,
  yjs_state bytea not null,
  preview jsonb not null default '{}'::jsonb,
  created_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version)
);

create index workspace_members_user_idx on public.workspace_members (user_id, status);
create index documents_workspace_idx on public.documents (workspace_id, type, updated_at desc);
create index document_snapshots_document_idx on public.document_snapshots (document_id, version desc);

create schema if not exists app_private;

create or replace function app_private.current_clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(coalesce(
    auth.jwt() ->> 'sub',
    auth.jwt() ->> 'user_id',
    current_setting('request.jwt.claim.sub', true)
  ), '');
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = app_private.current_clerk_user_id()
      and wm.status = 'active'
  );
$$;

create or replace function public.has_workspace_role(
  target_workspace_id uuid,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = app_private.current_clerk_user_id()
      and wm.status = 'active'
      and wm.role = any(allowed_roles)
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger workspaces_touch_updated_at
before update on public.workspaces
for each row execute function public.touch_updated_at();

create trigger workspace_members_touch_updated_at
before update on public.workspace_members
for each row execute function public.touch_updated_at();

create trigger documents_touch_updated_at
before update on public.documents
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.documents enable row level security;
alter table public.document_snapshots enable row level security;

create policy "profiles can read active workspace peers"
on public.profiles for select
to authenticated
using (
  id = app_private.current_clerk_user_id()
  or exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members peer on peer.workspace_id = mine.workspace_id
    where mine.user_id = app_private.current_clerk_user_id()
      and mine.status = 'active'
      and peer.status = 'active'
      and peer.user_id = profiles.id
  )
);

create policy "profiles can insert self"
on public.profiles for insert
to authenticated
with check (id = app_private.current_clerk_user_id());

create policy "profiles can update self"
on public.profiles for update
to authenticated
using (id = app_private.current_clerk_user_id())
with check (id = app_private.current_clerk_user_id());

create policy "members can read their workspaces"
on public.workspaces for select
to authenticated
using (public.is_workspace_member(id));

create policy "authenticated users can create workspaces"
on public.workspaces for insert
to authenticated
with check (created_by = app_private.current_clerk_user_id());

create policy "owners and admins can update workspaces"
on public.workspaces for update
to authenticated
using (public.has_workspace_role(id, array['owner', 'admin']::public.workspace_role[]))
with check (public.has_workspace_role(id, array['owner', 'admin']::public.workspace_role[]));

create policy "members can read memberships"
on public.workspace_members for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "owners and admins can manage memberships"
on public.workspace_members for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

create policy "owners and admins can update memberships"
on public.workspace_members for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

create policy "members can read documents"
on public.documents for select
to authenticated
using (public.is_workspace_member(workspace_id) and archived_at is null);

create policy "editors can create documents"
on public.documents for insert
to authenticated
with check (
  created_by = app_private.current_clerk_user_id()
  and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[])
);

create policy "editors can update documents"
on public.documents for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy "members can read snapshots"
on public.document_snapshots for select
to authenticated
using (
  exists (
    select 1
    from public.documents d
    where d.id = document_snapshots.document_id
      and public.is_workspace_member(d.workspace_id)
  )
);

create policy "editors can create snapshots"
on public.document_snapshots for insert
to authenticated
with check (
  exists (
    select 1
    from public.documents d
    where d.id = document_snapshots.document_id
      and public.has_workspace_role(d.workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[])
  )
);
