'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Goal, History, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { FIXTURE_STATUS_LABELS, FIXTURE_STATUS_TONES } from '@/entities/league/model/labels';
import {
  useFixtureHistory,
  useLeagueAppearances,
  useLeagueGoals,
  useLeagueSchedule,
  useLeagueTeams,
  useRemoveGoal,
  useSeason,
  useSetFixtureStatus,
} from '@/entities/league/model/queries';
import { fixtureScore } from '@/entities/league/model/standings';
import { useMembers } from '@/entities/member/model/queries';
import { GoalRecordForm } from '@/features/fixture-goal-record/ui/goal-record-form';
import { LineupForm } from '@/features/fixture-lineup-edit/ui/lineup-form';
import { useAuth } from '@/providers/auth-provider';
import { DESKTOP_QUERY, useMediaQuery } from '@/shared/lib/use-media-query';
import { useUrlState } from '@/shared/lib/use-url-state';
import { cn } from '@/shared/lib/utils';
import type { FixtureStatus, GoalEvent, LeagueTeam, LineupAuditSnapshot } from '@/shared/types/league';
import { Button } from '@/shared/ui/button';
import { CardSkeleton } from '@/shared/ui/card-skeleton';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer';
import { EmptyState, ErrorState } from '@/shared/ui/empty-state';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { StatusBadge } from '@/shared/ui/status-badge';

interface FixtureRecordProps {
  seasonId: string;
  fixtureId: string;
}

const NEXT_STATUS: Record<FixtureStatus, { status: FixtureStatus; label: string }> = {
  scheduled: { status: 'live', label: '경기 시작' },
  live: { status: 'final', label: '경기 종료' },
  final: { status: 'live', label: '기록 다시 열기' },
};

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

const isLineupSnapshot = (v: unknown): v is LineupAuditSnapshot => !!v && typeof v === 'object' && (v as { kind?: unknown }).kind === 'lineup';

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

/**
 * 리그 경기 기록(경기 당일 가장 중요한 화면, 스펙 §2.3).
 * - 모바일: 점수판 + 하단 고정 팀별 [골] 버튼 → 하단 시트(`?goal=<teamId>`)에서 득점자 → 도움.
 * - 데스크톱: 왼쪽 점수판·쿼터별 기록·변경 이력, 오른쪽 상시 기록 패널. 숫자 키로 쿼터 전환.
 * - 쿼터는 `?q=`(replace)라 새로고침해도 유지된다.
 * - 쿼터 출전 명단: `?lineup=<teamId>` — 모바일은 하단 시트, 데스크톱은 기록 패널이 명단 편집으로 바뀐다.
 */
export function FixtureRecord({ seasonId, fixtureId }: FixtureRecordProps) {
  const router = useRouter();
  const { isAdmin, member, user } = useAuth();
  const { data: season, isLoading, error, refetch } = useSeason(seasonId);
  const { data: teams = [] } = useLeagueTeams(seasonId);
  const { data: schedule, isLoading: scheduleLoading } = useLeagueSchedule(seasonId);
  const { data: goals = [] } = useLeagueGoals(seasonId);
  const { data: appearances = [], isSuccess: appearancesReady } = useLeagueAppearances(seasonId);
  const { data: history = [] } = useFixtureHistory(fixtureId);
  const { data: members = [] } = useMembers();
  const setStatus = useSetFixtureStatus();
  const removeGoal = useRemoveGoal();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [qParam, setQParam] = useUrlState('q', 'replace');
  const [goalParam, setGoalParam] = useUrlState('goal');
  const [lineupParam, setLineupParam] = useUrlState('lineup');

  const fixture = schedule?.fixtures.find((f) => f.id === fixtureId) ?? null;
  const matchday = fixture ? schedule?.matchdays.find((d) => d.id === fixture.matchday_id) : null;
  const quarters = season?.quarters_per_match ?? 3;
  const quarter = Math.min(Math.max(Number(qParam) || 1, 1), quarters);
  const home = teams.find((t) => t.id === fixture?.home_team_id);
  const away = teams.find((t) => t.id === fixture?.away_team_id);
  const isCaptain = !!member && [home, away].some((t) => t?.captain_member_id === member.id);
  const canRecord = isAdmin || isCaptain;
  const recording = canRecord && fixture?.status === 'live';

  useEffect(() => {
    if (!isDesktop || !recording) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (event.key === 'Escape' && lineupParam) {
        event.preventDefault();
        setLineupParam(null);
        return;
      }
      const n = Number(event.key);
      if (Number.isInteger(n) && n >= 1 && n <= quarters) {
        event.preventDefault();
        setQParam(String(n));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, recording, quarters, setQParam, lineupParam, setLineupParam]);

  if (isLoading || scheduleLoading) return <CardSkeleton count={2} />;
  if (error || !season) return <ErrorState title="경기를 불러오지 못했어요" description={error?.message} onRetry={() => refetch()} />;
  if (!fixture || !home || !away) {
    return <EmptyState icon={Goal} title="경기를 찾을 수 없어요" description="일정이 다시 만들어졌을 수 있어요. 시즌 화면에서 다시 고르세요." />;
  }

  const fixtureGoals = goals.filter((g) => g.fixture_id === fixture.id);
  const score = fixtureScore(fixture, fixtureGoals);
  const next = NEXT_STATUS[fixture.status];
  const nameOf = (id: string | null) => (id ? (members.find((m) => m.id === id)?.name ?? '?') : '득점자 미상');
  const sheetTeamId = goalParam === home.id || goalParam === away.id ? goalParam : null;
  const sheetOpen = isDesktop === false && recording && !!sheetTeamId;
  // 명단 폼은 직전 쿼터 명단을 초기값으로 쓰므로 출전 기록을 다 읽은 뒤에만 연다(딥링크·새로고침).
  const lineupTeam = recording && appearancesReady ? ([home, away].find((t) => t.id === lineupParam) ?? null) : null;
  const lineupOf = (q: number, teamId: string) =>
    appearances
      .filter((a) => a.fixture_id === fixture.id && a.quarter === q && a.team_id === teamId)
      .map((a) => nameOf(a.member_id))
      .sort((a, b) => a.localeCompare(b, 'ko'));

  const handleAdvance = async () => {
    try {
      await setStatus.mutateAsync({ fixtureId: fixture.id, seasonId, status: next.status });
      toast.success(`${next.label} 했어요.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '경기 상태를 바꾸지 못했습니다.');
    }
  };

  const handleRemove = async (goal: GoalEvent) => {
    try {
      await removeGoal.mutateAsync({ id: goal.id, seasonId, fixtureId: fixture.id, actorId: user?.id ?? null });
      toast.success('골 기록을 지웠어요.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '지우지 못했습니다.');
    }
  };

  const handleCloseSheet = () => {
    if (window.history.length > 1) router.back();
    else setGoalParam(null);
  };

  const handleCloseLineup = () => {
    if (window.history.length > 1) router.back();
    else setLineupParam(null);
  };

  const lineupForm = (team: LeagueTeam) => (
    <LineupForm
      key={`${team.id}-${quarter}`}
      seasonId={seasonId}
      fixture={fixture}
      team={team}
      quarter={quarter}
      appearances={appearances}
      playersPerSide={season.players_per_side}
      onDone={handleCloseLineup}
    />
  );

  const quarterOptions = Array.from({ length: quarters }, (_, i) => ({ value: String(i + 1), label: `${i + 1}Q` }));

  const scoreboard = (
    <section aria-label="점수" className="flex items-center justify-between gap-3 rounded-[16px] border border-border bg-background p-4 md:p-6">
      {[home, away].map((t, i) => (
        <div key={t.id} className={cn('flex min-w-0 flex-1 flex-col items-center gap-1', i === 1 && 'order-3')}>
          <span aria-hidden className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: t.color }} />
          <span className="truncate text-sm font-semibold text-ink">{t.name}</span>
        </div>
      ))}
      <p className="order-2 shrink-0 text-[40px] font-bold tabular-nums text-ink md:text-[52px]" aria-label={`${home.name} ${score.home} 대 ${away.name} ${score.away}`}>
        {score.home} : {score.away}
      </p>
    </section>
  );

  const timeline = (
    <section aria-labelledby="fixture-goals" className="flex flex-col gap-3">
      <h3 id="fixture-goals" className="text-[17px] font-bold text-ink">
        쿼터별 기록
      </h3>
      {fixtureGoals.length === 0 ? (
        <p className="rounded-[12px] bg-sunken px-4 py-3 text-sm text-ink-dim">아직 골 기록이 없어요.</p>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="골 기록">
          {Array.from({ length: quarters }, (_, i) => i + 1).map((q) => {
            const qGoals = fixtureGoals.filter((g) => g.quarter === q);
            if (qGoals.length === 0) return null;
            return (
              <li key={q} className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-ink-dim">{q}쿼터</span>
                <ul className="flex flex-col gap-1">
                  {qGoals.map((g) => {
                    const t = g.team_id === home.id ? home : away;
                    return (
                      <li key={g.id} className="flex min-h-[44px] items-center gap-2 rounded-[12px] border border-border px-3">
                        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">
                          <span className="font-semibold">{nameOf(g.scorer_id)}</span>
                          {g.own_goal && <span className="text-ink-dim"> (자책)</span>}
                          {g.assist_id && <span className="text-ink-dim"> · 도움 {nameOf(g.assist_id)}</span>}
                          <span className="text-ink-dim"> — {t.name}</span>
                        </span>
                        {canRecord && fixture.status !== 'scheduled' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            aria-label={`${nameOf(g.scorer_id)} 골 지우기`}
                            onClick={() => handleRemove(g)}
                            disabled={removeGoal.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );

  // 기록 중에는 고른 쿼터 명단만, 아니면 모든 쿼터 명단을 보여준다(경기 상세: 쿼터별 출전 명단).
  const shownQuarters = recording ? [quarter] : Array.from({ length: quarters }, (_, i) => i + 1);
  const hasAnyLineup = appearances.some((a) => a.fixture_id === fixture.id);
  const lineupSection = (recording || hasAnyLineup) && (
    <section aria-labelledby="fixture-lineups" className="flex flex-col gap-3">
      <h3 id="fixture-lineups" className="flex items-center gap-2 text-[17px] font-bold text-ink">
        <Users className="h-4 w-4" aria-hidden />
        {recording ? `${quarter}쿼터 출전 명단` : '쿼터별 출전 명단'}
      </h3>
      <ul className="flex flex-col gap-2" aria-label="출전 명단">
        {shownQuarters.flatMap((q) =>
          [home, away].map((t) => {
            const names = lineupOf(q, t.id);
            if (!recording && names.length === 0) return null;
            return (
              <li key={`${q}-${t.id}`} className="flex min-h-[52px] items-center gap-3 rounded-[12px] border border-border px-3 py-2" aria-label={`${q}쿼터 ${t.name} 명단`}>
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[12px] font-semibold text-ink-dim">
                    {recording ? t.name : `${q}Q · ${t.name}`} · <span className="tabular-nums">{names.length}명</span>
                  </span>
                  <span className="text-sm text-ink">{names.length > 0 ? names.join(', ') : '명단 없음 — 골 기록은 명단 없이도 돼요'}</span>
                </span>
                {recording && (
                  <Button
                    variant={lineupParam === t.id ? 'default' : 'outline'}
                    className="h-11 shrink-0"
                    aria-label={`${t.name} ${quarter}쿼터 명단 편집`}
                    onClick={() => setLineupParam(t.id)}
                  >
                    명단
                  </Button>
                )}
              </li>
            );
          }),
        )}
      </ul>
    </section>
  );

  const historySection = history.length > 0 && (
    <details className="rounded-[12px] border border-border px-4 py-3">
      <summary className="flex min-h-[28px] cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
        <History className="h-4 w-4" aria-hidden />
        변경 이력 ({history.length})
      </summary>
      <ol className="mt-2 flex flex-col gap-1 text-[13px] text-ink-dim">
        {history.map((log) => {
          const snapshot = log.after ?? log.before;
          const action = log.action === 'create' ? '기록' : log.action === 'delete' ? '삭제' : '수정';
          let what = '';
          if (isLineupSnapshot(snapshot)) {
            const t = snapshot.team_id === home.id ? home : away;
            what = `${snapshot.quarter}Q ${t.name} 출전 명단 ${isLineupSnapshot(log.after) ? log.after.member_ids.length : 0}명`;
          } else if (snapshot) {
            const g = snapshot as GoalEvent;
            what = `${g.quarter}Q ${nameOf(g.scorer_id)} 골`;
          }
          return (
            <li key={log.id} className="tabular-nums">
              {timeOf(log.at)} · {action} · {what}
            </li>
          );
        })}
      </ol>
    </details>
  );

  const header = (
    <header className="flex flex-col gap-3">
      <Link
        href={`/seasons/${seasonId}`}
        className="inline-flex min-h-[44px] items-center gap-1 self-start text-sm font-medium text-ink-dim outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {season.name}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={FIXTURE_STATUS_TONES[fixture.status]}>{FIXTURE_STATUS_LABELS[fixture.status]}</StatusBadge>
        {matchday && (
          <span className="text-sm tabular-nums text-ink-dim">
            {matchday.week}주차 · {matchday.date.replaceAll('-', '.')} · {fixture.order}경기
          </span>
        )}
      </div>
      <h2 className="text-[22px] font-bold text-ink">
        {home.name} vs {away.name}
      </h2>
      {canRecord && (
        <Button variant={fixture.status === 'scheduled' ? 'default' : 'outline'} className="h-11 self-start" onClick={handleAdvance} disabled={setStatus.isPending}>
          {next.label}
        </Button>
      )}
    </header>
  );

  const quarterPicker = recording && (
    <SegmentedControl ariaLabel="기록할 쿼터" value={String(quarter)} onChange={(v) => setQParam(v)} options={quarterOptions} />
  );

  if (isDesktop) {
    return (
      <article className="flex flex-col gap-6" aria-label="경기 기록">
        {header}
        {scoreboard}
        {/* 768~1023px는 사이드바 옆이 좁아 패널을 위에 쌓고, 1024px부터 2단으로 나눈다. */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="order-2 flex flex-col gap-6 lg:order-1">
            {lineupSection}
            {timeline}
            {historySection}
          </div>
          <aside className="order-1 flex flex-col gap-4 rounded-[16px] border border-border bg-sunken/40 p-5 lg:sticky lg:top-6 lg:order-2" aria-label="기록 패널">
            {recording && lineupTeam ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-ink">
                    {lineupTeam.name} · {quarter}쿼터 출전 명단
                  </h3>
                  <span className="text-[12px] text-ink-dim">
                    <kbd className="rounded border border-border px-1">Esc</kbd> 닫기
                  </span>
                </div>
                {lineupForm(lineupTeam)}
              </>
            ) : recording ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-ink">골 기록</h3>
                  <span className="text-[12px] text-ink-dim">
                    쿼터 전환 <kbd className="rounded border border-border px-1">1</kbd>–<kbd className="rounded border border-border px-1">{quarters}</kbd>
                  </span>
                </div>
                {quarterPicker}
                <GoalRecordForm key={quarter} seasonId={seasonId} fixture={fixture} teams={teams} quarter={quarter} />
              </>
            ) : (
              <p className="text-sm text-ink-dim">
                {!canRecord ? '기록은 운영진과 두 팀 팀장이 할 수 있어요.' : fixture.status === 'scheduled' ? '경기 시작을 누르면 기록할 수 있어요.' : '경기가 끝났어요. 고치려면 기록 다시 열기를 누르세요.'}
              </p>
            )}
          </aside>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-5 pb-24" aria-label="경기 기록">
      {header}
      {scoreboard}
      {quarterPicker}
      {lineupSection}
      {timeline}
      {historySection}

      {recording && (
        <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+1px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {[home, away].map((t) => (
              <Button key={t.id} className="h-14 text-base font-bold" onClick={() => setGoalParam(t.id)}>
                <span aria-hidden className="mr-2 h-3 w-3 rounded-full border border-white/60" style={{ backgroundColor: t.color }} />
                {t.name} 골
              </Button>
            ))}
          </div>
        </div>
      )}

      {isDesktop === false && (
        <Drawer open={!!lineupTeam} onOpenChange={(open) => (open ? undefined : handleCloseLineup())}>
          <DrawerContent className="max-h-[92vh] overflow-y-auto">
            <DrawerHeader>
              <DrawerTitle>
                {lineupTeam?.name} · {quarter}쿼터 출전 명단
              </DrawerTitle>
              <DrawerDescription>이 쿼터에 뛴 선수를 고르세요. 직전 쿼터 명단이 기본값이에요.</DrawerDescription>
            </DrawerHeader>
            {lineupTeam && lineupForm(lineupTeam)}
          </DrawerContent>
        </Drawer>
      )}

      {isDesktop === false && (
        <Drawer open={sheetOpen} onOpenChange={(open) => (open ? undefined : handleCloseSheet())}>
          <DrawerContent className="max-h-[92vh] overflow-y-auto">
            <DrawerHeader>
              <DrawerTitle>{quarter}쿼터 골 기록</DrawerTitle>
              <DrawerDescription>득점자를 고르고, 도움을 고르면 바로 저장돼요.</DrawerDescription>
            </DrawerHeader>
            <GoalRecordForm
              key={`${sheetTeamId}-${quarter}`}
              seasonId={seasonId}
              fixture={fixture}
              teams={teams}
              quarter={quarter}
              initialTeamId={sheetTeamId}
              onDone={handleCloseSheet}
            />
          </DrawerContent>
        </Drawer>
      )}
    </article>
  );
}
