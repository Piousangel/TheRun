do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    create type public.app_role as enum ('admin', 'member');
  end if;
end
$$;

create table if not exists public.app_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role public.app_role not null default 'member',
  member_id uuid unique references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_profiles_member_id on public.app_profiles(member_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_app_profiles_updated_at on public.app_profiles;
create trigger set_app_profiles_updated_at
before update on public.app_profiles
for each row execute function public.set_updated_at();

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.app_profiles enable row level security;

drop policy if exists "Users can view own profile" on public.app_profiles;
create policy "Users can view own profile"
on public.app_profiles
for select
using (
  auth.uid() = id
  or public.is_current_user_admin()
);

drop policy if exists "Users can insert own profile" on public.app_profiles;
create policy "Users can insert own profile"
on public.app_profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.app_profiles;
create policy "Users can update own profile"
on public.app_profiles
for update
using (
  auth.uid() = id
  or public.is_current_user_admin()
)
with check (
  auth.uid() = id
  or public.is_current_user_admin()
);
