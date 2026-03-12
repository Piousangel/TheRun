create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'general' check (category in ('general', 'match', 'schedule', 'urgent')),
  is_pinned boolean not null default false,
  publish_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcement_reads (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (announcement_id, user_id)
);

create index if not exists idx_announcements_publish_at on public.announcements(publish_at desc);
create index if not exists idx_announcement_reads_user_id on public.announcement_reads(user_id);

drop trigger if exists set_announcements_updated_at on public.announcements;
create trigger set_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;

drop policy if exists "Authenticated users can read announcements" on public.announcements;
create policy "Authenticated users can read announcements"
on public.announcements
for select
using (auth.uid() is not null);

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
on public.announcements
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Users can read own announcement reads" on public.announcement_reads;
create policy "Users can read own announcement reads"
on public.announcement_reads
for select
using (auth.uid() = user_id or public.is_current_user_admin());

drop policy if exists "Users can manage own announcement reads" on public.announcement_reads;
create policy "Users can manage own announcement reads"
on public.announcement_reads
for all
using (auth.uid() = user_id or public.is_current_user_admin())
with check (auth.uid() = user_id or public.is_current_user_admin());
