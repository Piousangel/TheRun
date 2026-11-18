-- S0 스키마 초안 2: 멤버 · 계정 프로필 · 초대 코드 + 읽기/쓰기 정책(RLS).
-- 운영 DB는 비어 있다(2026-11-15 실측). 낡은 스키마를 올리지 않고 결정 사항을 처음부터 반영한다.
--   D-03 전화번호는 도메인에 없다. D-10 소셜 로그인(Google·Kakao) + 초대 코드로 멤버 연결.
--   재연결 차단 #1(가입 게이트): 로그인했다고 명부가 읽히지 않는다 — 멤버와 연결된 계정만 읽는다.
--   차단 #3·#4: 사용자가 멤버를 고르는 흐름이 없다. 연결은 초대 코드 사용으로만 일어난다.
-- 역할(role) 변경 함수는 이 파일에 없다. 첫 슈퍼관리자 지정은 사람 확인이 필요한 별도 절차다(OPERATING 5장).

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('member', 'admin', 'superadmin');
  end if;
end
$$;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  profile_photo text,
  stats jsonb not null default '{"speed":50,"shooting":50,"passing":50,"dribbling":50,"stamina":50,"defense":50}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role public.app_role not null default 'member',
  member_id uuid unique references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 코드는 SHA-256 해시로만 저장한다(평문은 발급 응답에서만 보인다).
create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  member_id uuid not null references public.members(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id),
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_invite_codes_member on public.invite_codes(member_id);

-- 초안 1에서 미뤄 둔 FK
alter table public.league_teams
  add constraint league_teams_captain_member_fk
  foreign key (captain_member_id) references public.members(id) on delete set null;
alter table public.checkins
  add constraint checkins_member_fk
  foreign key (member_id) references public.members(id) on delete cascade;

drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at before update on public.members
  for each row execute function public.set_updated_at();
drop trigger if exists set_app_profiles_updated_at on public.app_profiles;
create trigger set_app_profiles_updated_at before update on public.app_profiles
  for each row execute function public.set_updated_at();

-- ── 권한 헬퍼 ──────────────────────────────────────────────────
-- security definer + 고정 search_path. 정책이 profiles를 다시 조회하며 재귀하지 않게 한다.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.app_profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

create or replace function public.is_superadmin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.app_profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

-- 클럽 멤버와 연결된 계정인가(가입 게이트). 운영진은 연결 전에도 통과한다.
create or replace function public.is_club_member() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.app_profiles
    where id = auth.uid() and member_id is not null
  );
$$;

create or replace function public.current_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select member_id from public.app_profiles where id = auth.uid();
$$;

-- ── 계정 생성: 로그인 때 member 프로필을 자동으로 만든다 ──────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 초대 코드 ─────────────────────────────────────────────────
create or replace function public.normalize_invite_code(p_code text) returns text
language sql immutable as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

create or replace function public.hash_invite_code(p_code text) returns text
language sql immutable as $$
  select encode(sha256(convert_to(public.normalize_invite_code(p_code), 'UTF8')), 'hex');
$$;

-- 운영진 전용. 같은 멤버의 미사용 코드는 폐기하고 새 코드를 만든다(7일 만료, 1회용).
-- 코드 원문은 앱(서버)이 난수로 만들어 넘기고, DB에는 해시만 남는다.
create or replace function public.issue_invite_code(p_member_id uuid, p_code text)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_expires timestamptz := now() + interval '7 days';
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '운영진만 초대 코드를 발급할 수 있습니다.';
  end if;
  if char_length(public.normalize_invite_code(p_code)) < 8 then
    raise exception '코드가 너무 짧습니다.';
  end if;
  if not exists (select 1 from public.members where id = p_member_id) then
    raise exception '멤버를 찾을 수 없습니다.';
  end if;
  if exists (select 1 from public.app_profiles where member_id = p_member_id) then
    raise exception '이미 계정이 연결된 멤버입니다.';
  end if;

  update public.invite_codes
    set revoked_at = now()
    where member_id = p_member_id and used_at is null and revoked_at is null;

  insert into public.invite_codes (code_hash, member_id, expires_at, created_by)
  values (public.hash_invite_code(p_code), p_member_id, v_expires, auth.uid());

  return v_expires;
end;
$$;

-- 로그인한 본인이 코드를 쓴다. 실패 사유는 한 가지 메시지로 통일한다(추측 단서 차단).
create or replace function public.redeem_invite_code(p_code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_code public.invite_codes;
  v_bad constant text := '사용할 수 없는 코드입니다.';
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  -- 선점: 한 문장으로 유효 조건 검사와 사용 처리를 같이 한다.
  update public.invite_codes
    set used_at = now(), used_by = auth.uid()
    where code_hash = public.hash_invite_code(p_code)
      and used_at is null and revoked_at is null and expires_at > now()
    returning * into v_code;
  if v_code.id is null then
    raise exception '%', v_bad;
  end if;

  -- 프로필이 없으면(트리거 이전 계정 등) 만든다.
  insert into public.app_profiles (id, email)
  values (auth.uid(), (select email from auth.users where id = auth.uid()))
  on conflict (id) do nothing;

  if exists (select 1 from public.app_profiles where id = auth.uid() and member_id is not null) then
    raise exception '%', v_bad;
  end if;
  if exists (select 1 from public.app_profiles where member_id = v_code.member_id) then
    raise exception '%', v_bad;
  end if;

  update public.app_profiles
    set member_id = v_code.member_id
    where id = auth.uid();

  return v_code.member_id;
end;
$$;

-- 함수 실행 권한: 기본 PUBLIC 실행을 거두고 로그인 사용자에게만 연다.
revoke all on function public.issue_invite_code(uuid, text) from public, anon;
revoke all on function public.redeem_invite_code(text) from public, anon;
grant execute on function public.issue_invite_code(uuid, text) to authenticated;
grant execute on function public.redeem_invite_code(text) to authenticated;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_superadmin() from public, anon;
revoke all on function public.is_club_member() from public, anon;
revoke all on function public.current_member_id() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.is_club_member() to authenticated;
grant execute on function public.current_member_id() to authenticated;

-- ── RLS ───────────────────────────────────────────────────────
alter table public.members enable row level security;
alter table public.app_profiles enable row level security;
alter table public.invite_codes enable row level security;

-- members: 멤버와 연결된 계정(또는 운영진)만 읽고, 쓰기는 운영진만.
drop policy if exists members_select on public.members;
create policy members_select on public.members for select to authenticated
  using (public.is_club_member());
drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert to authenticated
  with check (public.is_admin());
drop policy if exists members_update on public.members;
create policy members_update on public.members for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists members_delete on public.members;
create policy members_delete on public.members for delete to authenticated
  using (public.is_admin());

-- app_profiles: 내 것 또는 운영진이 읽는다. 클라이언트의 직접 쓰기 정책은 없다
-- (생성은 트리거, 멤버 연결은 redeem_invite_code, 역할은 별도 절차) → role 자가 승격 불가.
drop policy if exists app_profiles_select on public.app_profiles;
create policy app_profiles_select on public.app_profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- invite_codes: 운영진만 목록을 본다. 쓰기는 issue/redeem 함수로만.
drop policy if exists invite_codes_select on public.invite_codes;
create policy invite_codes_select on public.invite_codes for select to authenticated
  using (public.is_admin());

-- 리그·출석·감사(초안 1의 테이블): 읽기만 연다. 쓰기 정책은 기록 화면(S2)과 함께 추가한다.
drop policy if exists seasons_select on public.seasons;
create policy seasons_select on public.seasons for select to authenticated using (public.is_club_member());
drop policy if exists league_teams_select on public.league_teams;
create policy league_teams_select on public.league_teams for select to authenticated using (public.is_club_member());
drop policy if exists matchdays_select on public.matchdays;
create policy matchdays_select on public.matchdays for select to authenticated using (public.is_club_member());
drop policy if exists fixtures_select on public.fixtures;
create policy fixtures_select on public.fixtures for select to authenticated using (public.is_club_member());
drop policy if exists checkins_select on public.checkins;
create policy checkins_select on public.checkins for select to authenticated using (public.is_club_member());
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated using (public.is_admin());
