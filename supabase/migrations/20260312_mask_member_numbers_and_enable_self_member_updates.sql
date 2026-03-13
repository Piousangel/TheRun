update public.members
set phone_number = '000-0000-0000';

create or replace function public.link_my_member(target_member_id uuid)
returns public.app_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  linked_profile public.app_profiles;
  current_linked_member_id uuid;
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

  select member_id
  into current_linked_member_id
  from public.app_profiles
  where id = auth.uid();

  if current_linked_member_id is not null and current_linked_member_id <> target_member_id then
    raise exception '이미 다른 멤버와 연결되어 있습니다. 먼저 연결을 해제해주세요.';
  end if;

  if not exists (
    select 1
    from public.members
    where id = target_member_id
  ) then
    raise exception '연결할 멤버를 찾을 수 없습니다.';
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

create or replace function public.update_my_member_profile(input_name text, input_phone text)
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_member public.members;
  target_member_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if btrim(input_name) = '' then
    raise exception '이름을 입력해주세요.';
  end if;

  if btrim(input_phone) !~ '^(010|000)-[0-9]{4}-[0-9]{4}$' then
    raise exception '전화번호는 010-1234-5678 또는 000-0000-0000 형식이어야 합니다.';
  end if;

  select member_id
  into target_member_id
  from public.app_profiles
  where id = auth.uid();

  if target_member_id is null then
    raise exception '먼저 내 멤버를 연결해주세요.';
  end if;

  update public.members
  set name = btrim(input_name),
      phone_number = btrim(input_phone),
      updated_at = now()
  where id = target_member_id
  returning * into updated_member;

  return updated_member;
end;
$$;

create or replace function public.get_claimable_members()
returns setof public.members
language sql
security definer
set search_path = public
as $$
  select m.*
  from public.members m
  left join public.app_profiles p on p.member_id = m.id
  where p.id is null or p.id = auth.uid()
  order by m.name asc;
$$;
