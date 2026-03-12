create or replace function public.current_member_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select member_id
  from public.app_profiles
  where id = auth.uid();
$$;

create or replace function public.link_my_member(target_member_id uuid, input_phone text)
returns public.app_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  linked_profile public.app_profiles;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  insert into public.app_profiles (id, email)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid())
  )
  on conflict (id) do nothing;

  if not exists (
    select 1
    from public.members
    where id = target_member_id
      and phone_number = btrim(input_phone)
  ) then
    raise exception '전화번호가 일치하지 않습니다.';
  end if;

  if exists (
    select 1
    from public.app_profiles
    where member_id = target_member_id
      and id <> auth.uid()
  ) then
    raise exception '이미 다른 계정에 연결된 멤버입니다.';
  end if;

  update public.app_profiles
  set member_id = target_member_id
  where id = auth.uid()
  returning * into linked_profile;

  return linked_profile;
end;
$$;

create or replace function public.unlink_my_member()
returns public.app_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  unlinked_profile public.app_profiles;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  update public.app_profiles
  set member_id = null
  where id = auth.uid()
  returning * into unlinked_profile;

  return unlinked_profile;
end;
$$;

create or replace function public.guard_app_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return new;
  end if;

  if auth.uid() is distinct from old.id then
    raise exception '자신의 프로필만 수정할 수 있습니다.';
  end if;

  if new.role is distinct from old.role then
    raise exception '역할은 직접 변경할 수 없습니다.';
  end if;

  if new.member_id is distinct from old.member_id then
    raise exception '멤버 연결은 전용 함수로만 변경할 수 있습니다.';
  end if;

  if new.id is distinct from old.id then
    raise exception '프로필 ID는 변경할 수 없습니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_app_profiles_update on public.app_profiles;
create trigger guard_app_profiles_update
before update on public.app_profiles
for each row execute function public.guard_app_profile_update();

drop policy if exists "Users can update own profile" on public.app_profiles;
drop policy if exists "Users can insert own profile" on public.app_profiles;
drop policy if exists "Admins can update all profiles" on public.app_profiles;
create policy "Users can insert own profile"
on public.app_profiles
for insert
with check (
  auth.uid() = id
  and role = 'member'
);
create policy "Admins can update all profiles"
on public.app_profiles
for update
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Allow all for members" on public.members;
drop policy if exists "Authenticated users can read members" on public.members;
drop policy if exists "Admins manage members" on public.members;
create policy "Authenticated users can read members"
on public.members
for select
using (auth.uid() is not null);
create policy "Admins manage members"
on public.members
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Allow all for attendance_sessions" on public.attendance_sessions;
drop policy if exists "Authenticated users can read attendance sessions" on public.attendance_sessions;
drop policy if exists "Admins manage attendance sessions" on public.attendance_sessions;
create policy "Authenticated users can read attendance sessions"
on public.attendance_sessions
for select
using (auth.uid() is not null);
create policy "Admins manage attendance sessions"
on public.attendance_sessions
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Allow all for attendance_votes" on public.attendance_votes;
drop policy if exists "Authenticated users can read attendance votes" on public.attendance_votes;
drop policy if exists "Members manage own attendance votes" on public.attendance_votes;
create policy "Authenticated users can read attendance votes"
on public.attendance_votes
for select
using (auth.uid() is not null);
create policy "Members manage own attendance votes"
on public.attendance_votes
for all
using (
  public.is_current_user_admin()
  or member_id = public.current_member_id()
)
with check (
  public.is_current_user_admin()
  or member_id = public.current_member_id()
);

drop policy if exists "Allow all for vote_sessions" on public.vote_sessions;
drop policy if exists "Authenticated users can read vote sessions" on public.vote_sessions;
drop policy if exists "Admins manage vote sessions" on public.vote_sessions;
create policy "Authenticated users can read vote sessions"
on public.vote_sessions
for select
using (auth.uid() is not null);
create policy "Admins manage vote sessions"
on public.vote_sessions
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Allow all for vote_responses" on public.vote_responses;
drop policy if exists "Authenticated users can read vote responses" on public.vote_responses;
drop policy if exists "Members manage own vote responses" on public.vote_responses;
create policy "Authenticated users can read vote responses"
on public.vote_responses
for select
using (auth.uid() is not null);
create policy "Members manage own vote responses"
on public.vote_responses
for all
using (
  public.is_current_user_admin()
  or member_id = public.current_member_id()
)
with check (
  public.is_current_user_admin()
  or member_id = public.current_member_id()
);

drop policy if exists "Allow all for matches" on public.matches;
drop policy if exists "Authenticated users can read matches" on public.matches;
drop policy if exists "Admins manage matches" on public.matches;
create policy "Authenticated users can read matches"
on public.matches
for select
using (auth.uid() is not null);
create policy "Admins manage matches"
on public.matches
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public member photo read" on storage.objects;
drop policy if exists "Admins manage member photos" on storage.objects;
create policy "Public member photo read"
on storage.objects
for select
using (bucket_id = 'member-photos');
create policy "Admins manage member photos"
on storage.objects
for all
using (
  bucket_id = 'member-photos'
  and public.is_current_user_admin()
)
with check (
  bucket_id = 'member-photos'
  and public.is_current_user_admin()
);
