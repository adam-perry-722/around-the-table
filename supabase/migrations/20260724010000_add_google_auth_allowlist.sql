-- Approved users for Around The Table. Authorization is stored in app-owned
-- data rather than editable Google profile metadata.
create table if not exists public.allowed_users (
  email text primary key,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  constraint allowed_users_email_lowercase check (email = lower(email))
);

insert into public.allowed_users (email, is_admin)
values
  ('perrys235@gmail.com', true),
  ('chris@windsongchurch.org', true)
on conflict (email) do update
set is_admin = excluded.is_admin;

alter table public.allowed_users enable row level security;
alter table public.families enable row level security;
alter table public.sessions enable row level security;

-- SECURITY DEFINER prevents recursive allowed_users RLS checks. Authorization
-- is derived from Supabase's verified JWT email claim.
create or replace function public.is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.allowed_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_allowed_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.allowed_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and is_admin
  );
$$;

revoke all on function public.is_allowed_user() from public;
revoke all on function public.is_allowed_admin() from public;
grant execute on function public.is_allowed_user() to authenticated;
grant execute on function public.is_allowed_admin() to authenticated;

-- Remove older policies so a permissive legacy policy cannot bypass the
-- allow-list. These tables are exclusively owned by this application.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('allowed_users', 'families', 'sessions')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      existing_policy.policyname,
      existing_policy.tablename
    );
  end loop;
end
$$;

create policy "Users can read their own access record"
on public.allowed_users
for select
to authenticated
using (
  email = lower(coalesce(auth.jwt() ->> 'email', ''))
  or public.is_allowed_admin()
);

create policy "Admins can manage allowed users"
on public.allowed_users
for all
to authenticated
using (public.is_allowed_admin())
with check (public.is_allowed_admin());

create policy "Allowed users can manage families"
on public.families
for all
to authenticated
using (public.is_allowed_user())
with check (public.is_allowed_user());

create policy "Allowed users can manage sessions"
on public.sessions
for all
to authenticated
using (public.is_allowed_user())
with check (public.is_allowed_user());

revoke all on table public.allowed_users from anon;
revoke all on table public.families from anon;
revoke all on table public.sessions from anon;

grant select, insert, update, delete on table public.allowed_users to authenticated;
grant select, insert, update, delete on table public.families to authenticated;
grant select, insert, update, delete on table public.sessions to authenticated;
