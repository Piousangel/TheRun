alter table public.app_profiles
alter column role set default 'member';

update public.app_profiles
set role = 'admin';
from auth.users
where auth.users.id = public.app_profiles.id
  and (
    auth.users.raw_app_meta_data ->> 'provider' in ('google', 'naver')
    or exists (
      select 1
      from jsonb_array_elements_text(coalesce(auth.users.raw_app_meta_data -> 'providers', '[]'::jsonb)) as provider_name
      where provider_name in ('google', 'naver')
    )
  );
