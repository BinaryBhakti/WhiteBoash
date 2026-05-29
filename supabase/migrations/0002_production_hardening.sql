create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id text references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 3 and 120),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_workspace_idx on public.audit_events (workspace_id, created_at desc);

alter table public.audit_events enable row level security;

create policy "owners and admins can read audit events"
on public.audit_events for select
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

create policy "owners and admins can create audit events"
on public.audit_events for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));
