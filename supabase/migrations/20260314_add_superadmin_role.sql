do $$
begin
  alter type public.app_role add value if not exists 'superadmin';
exception
  when duplicate_object then null;
end
$$;

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
      and role in ('admin', 'superadmin')
  );
$$;

update public.app_profiles
set role = 'superadmin'
where email = 'yyh7654@gmail.com';
