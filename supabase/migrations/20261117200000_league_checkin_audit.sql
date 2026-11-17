-- S0 스키마 초안 1: 리그(시즌·팀·경기일·경기) + 출석 체크인 + 감사 로그.
-- 운영 DB는 비어 있다. members·인증 테이블은 다음 마이그레이션(로그인·초대 코드)에서 만들고 그때 FK를 건다.
-- RLS는 켜 두고 정책은 아직 없다 = 클라이언트 접근 전부 거부(안전한 기본값). 정책은 역할 모델과 함께 추가한다.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft' check (status in ('draft','active','done')),
  quarters_per_match int not null default 3 check (quarters_per_match > 0),
  quarter_minutes int not null default 10 check (quarter_minutes > 0),
  players_per_side int not null default 6 check (players_per_side > 0),
  points jsonb not null default '{"win":3,"draw":1,"loss":0}'::jsonb,
  tiebreakers text[] not null default array['goal_diff','goals_for','head_to_head'],
  mvp_method text not null default 'member_vote' check (mvp_method in ('member_vote','admin_pick','champion_vote')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists public.league_teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  name text not null,
  color text not null,
  captain_member_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_league_teams_season on public.league_teams(season_id);

create table if not exists public.matchdays (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  week int not null check (week > 0),
  date date not null,
  venue text,
  unique (season_id, week)
);

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  "order" int not null check ("order" > 0),
  home_team_id uuid not null references public.league_teams(id),
  away_team_id uuid not null references public.league_teams(id),
  status text not null default 'scheduled' check (status in ('scheduled','live','final')),
  unique (matchday_id, "order"),
  check (home_team_id <> away_team_id)
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  member_id uuid not null,
  status text not null check (status in ('on_time','late','absent')),
  checked_in_at timestamptz,
  confirmed_by uuid,
  updated_at timestamptz not null default now(),
  unique (date, member_id)
);
create index if not exists idx_checkins_member on public.checkins(member_id, date desc);

-- 추가 전용: 고치거나 지우는 정책을 만들지 않는다(+ 아래 트리거로 서버에서도 막는다).
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id text not null,
  action text not null check (action in ('create','update','delete')),
  before jsonb,
  after jsonb,
  actor_id uuid not null,
  at timestamptz not null default now()
);
create index if not exists idx_audit_logs_target on public.audit_logs(entity, entity_id, at desc);

create or replace function public.audit_logs_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_logs는 추가 전용이다';
end;
$$;
drop trigger if exists audit_logs_no_change on public.audit_logs;
create trigger audit_logs_no_change before update or delete on public.audit_logs
  for each row execute function public.audit_logs_append_only();

drop trigger if exists set_seasons_updated_at on public.seasons;
create trigger set_seasons_updated_at before update on public.seasons
  for each row execute function public.set_updated_at();
drop trigger if exists set_checkins_updated_at on public.checkins;
create trigger set_checkins_updated_at before update on public.checkins
  for each row execute function public.set_updated_at();

alter table public.seasons enable row level security;
alter table public.league_teams enable row level security;
alter table public.matchdays enable row level security;
alter table public.fixtures enable row level security;
alter table public.checkins enable row level security;
alter table public.audit_logs enable row level security;
