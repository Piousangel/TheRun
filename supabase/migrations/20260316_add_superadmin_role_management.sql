create or replace function public.is_current_user_superadmin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_profiles
    where id = auth.uid()
      and role = 'superadmin'
  );
$$;

create or replace function public.set_app_profile_role(
  target_profile_id uuid,
  next_role public.app_role
)
returns public.app_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.app_profiles;
  target_role public.app_role;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_current_user_superadmin() then
    raise exception '슈퍼관리자만 역할을 변경할 수 있습니다.';
  end if;

  if target_profile_id = auth.uid() then
    raise exception '자기 자신의 역할은 이 화면에서 변경할 수 없습니다.';
  end if;

  if next_role not in ('member', 'admin') then
    raise exception '이 화면에서는 member/admin 역할만 변경할 수 있습니다.';
  end if;

  select role
  into target_role
  from public.app_profiles
  where id = target_profile_id;

  if target_role is null then
    raise exception '대상 프로필을 찾을 수 없습니다.';
  end if;

  if target_role = 'superadmin' then
    raise exception '슈퍼관리자 계정은 이 화면에서 변경할 수 없습니다.';
  end if;

  update public.app_profiles
  set role = next_role
  where id = target_profile_id
  returning * into updated_profile;

  if updated_profile is null then
    raise exception '대상 프로필을 찾을 수 없습니다.';
  end if;

  return updated_profile;
end;
$$;

drop policy if exists "Admins can update all profiles" on public.app_profiles;
drop policy if exists "Superadmins can update all profiles" on public.app_profiles;
create policy "Superadmins can update all profiles"
on public.app_profiles
for update
using (public.is_current_user_superadmin())
with check (public.is_current_user_superadmin());
