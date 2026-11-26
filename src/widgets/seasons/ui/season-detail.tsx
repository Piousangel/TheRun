'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronRight, Crown, Medal, Plus, Shirt, Target, Trophy, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  MVP_METHOD_LABELS,
  SEASON_STATUS_LABELS,
  SEASON_STATUS_TONES,
  TIEBREAKER_LABELS,
  formatMiniGamePoints,
  formatSeasonFormat,
  formatSeasonPoints,
  formatSeasonRange,
  teamColorLabel,
} from '@/entities/league/model/labels';
import {
  useLeagueAppearances,
  useLeagueGoals,
  useLeagueMiniGames,
  useLeagueSchedule,
  useLeagueTeams,
  useSeason,
  useUpdateSeason,
} from '@/entities/league/model/queries';
import { computePlayerStats, rankPlayers, type PlayerStatKey } from '@/entities/league/model/player-stats';
import { computeStandings, fixtureScore } from '@/entities/league/model/standings';
import { computeAttendanceKing } from '@/entities/checkin/model/attendance-king';
import { useCheckinsOnDates } from '@/entities/checkin/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { ScheduleGenerateForm } from '@/features/league-schedule-generate/ui/schedule-generate-form';
import { MiniGameForm } from '@/features/league-minigame/ui/minigame-form';
import { MiniGameResultForm } from '@/features/league-minigame/ui/minigame-result-form';
import { LeagueTeamForm } from '@/features/league-team-edit/ui/league-team-form';
import { useAuth } from '@/providers/auth-provider';
import { kstToday } from '@/shared/lib/checkin-time';
import { DESKTOP_QUERY, useMediaQuery } from '@/shared/lib/use-media-query';
import { useUrlState } from '@/shared/lib/use-url-state';
import { cn } from '@/shared/lib/utils';
import type { Fixture, GoalEvent, MiniGame, SeasonStatus } from '@/shared/types/league';
import { Button } from '@/shared/ui/button';
import { CardSkeleton } from '@/shared/ui/card-skeleton';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer';
import { EmptyState, ErrorState } from '@/shared/ui/empty-state';
import { StatusBadge } from '@/shared/ui/status-badge';

const TEAM_NEW = 'new';
const MINIGAME_NEW = 'new';

const NEXT_STATUS: Partial<Record<SeasonStatus, { status: SeasonStatus; label: string }>> = {
  draft: { status: 'active', label: '시즌 시작' },
  active: { status: 'done', label: '시즌 종료' },
};

interface SeasonDetailProps {
  seasonId: string;
}

/**
 * 시즌 상세. 운영진은 여기서 팀·팀장을 정하고 일정을 만든다.
 * - 팀 만들기/수정: `?team=new|<id>` — 모바일은 하단 시트, 데스크톱은 팀 목록 위 인라인 패널.
 * - 일정: 모바일은 주차 카드, 데스크톱은 주차 × 경기 표.
 * - 미니게임: `?minigame=new|<id>` — 종목 추가(운영진)·결과 입력(운영진·팀장). 모바일은 시트, 데스크톱은 목록 위 패널.
 */
export function SeasonDetail({ seasonId }: SeasonDetailProps) {
  const router = useRouter();
  const { isAdmin, member } = useAuth();
  const { data: season, isLoading, error, refetch } = useSeason(seasonId);
  const { data: teams } = useLeagueTeams(seasonId);
  const { data: schedule } = useLeagueSchedule(seasonId);
  const { data: goals = [] } = useLeagueGoals(seasonId);
  const { data: appearances = [] } = useLeagueAppearances(seasonId);
  const { data: miniGames = [] } = useLeagueMiniGames(seasonId);
  const { data: members } = useMembers();
  const updateSeason = useUpdateSeason();
  const [teamParam, setTeamParam] = useUrlState('team');
  const [miniGameParam, setMiniGameParam] = useUrlState('minigame');
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  // 출석왕은 지난 경기일만 센다(오늘 포함). 앞으로의 경기일은 결석으로 치지 않는다.
  const today = kstToday(new Date());
  const pastDays = (schedule?.matchdays ?? []).map((d) => d.date).filter((d) => d <= today);
  const { data: checkins = [], isLoading: checkinsLoading, error: checkinsError } = useCheckinsOnDates(pastDays);

  if (isLoading) return <CardSkeleton count={2} />;
  if (error || !season) {
    return <ErrorState title="시즌을 불러오지 못했어요" description={error?.message} onRetry={() => refetch()} />;
  }

  const next = NEXT_STATUS[season.status];
  const standings = computeStandings(season, teams ?? [], schedule?.fixtures ?? [], goals, miniGames);
  const hasMiniGames = miniGames.length > 0;
  const hasSchedule = !!schedule && schedule.matchdays.length > 0;
  const editingTeam = teamParam && teamParam !== TEAM_NEW ? (teams?.find((t) => t.id === teamParam) ?? null) : null;
  // 팀 목록이 아직 없으면 수정 대상을 모르므로 폼을 열지 않는다.
  const teamFormOpen = isAdmin && (teamParam === TEAM_NEW || !!editingTeam);
  // 미니게임 결과는 경기 기록처럼 운영진과 팀장이 입력한다(스펙 §2.1-1). 종목 추가·삭제는 시즌 설정이라 운영진만.
  const isCaptain = !!member && !!teams?.some((t) => t.captain_member_id === member.id);
  const canRecordMiniGame = isAdmin || isCaptain;
  const editingMiniGame = miniGameParam && miniGameParam !== MINIGAME_NEW ? (miniGames.find((g) => g.id === miniGameParam) ?? null) : null;
  const miniGameMode: 'new' | 'result' | null =
    miniGameParam === MINIGAME_NEW && isAdmin ? 'new' : editingMiniGame && canRecordMiniGame && teams && teams.length > 0 ? 'result' : null;
  const matchdayLabel = (game: MiniGame) => {
    const day = game.matchday_id ? schedule?.matchdays.find((d) => d.id === game.matchday_id) : null;
    return day ? `${day.week}주차 · ${day.date.slice(5).replace('-', '.')}` : '경기일 미정';
  };
  const resultLabel = (game: MiniGame) =>
    game.results.length === 0 ? '결과 없음' : game.results.map((r) => `${r.rank}위 ${teamName(r.team_id)}`).join(' · ');
  const teamName = (id: string) => teams?.find((t) => t.id === id)?.name ?? '?';
  const teamColor = (id: string) => teams?.find((t) => t.id === id)?.color ?? 'transparent';
  const memberName = (id: string | null) => (id ? (members?.find((m) => m.id === id)?.name ?? null) : null);
  // 개인 기록은 끝난 경기만이 아니라 기록된 모든 경기에서 계산한다(경기 중에도 득점 순위가 바로 보인다).
  const playerStats = computePlayerStats(goals, appearances);
  const nameOrDash = (id: string) => memberName(id) ?? '?';
  const leaders: { key: PlayerStatKey; title: string; unit: string }[] = [
    { key: 'goals', title: '득점', unit: '골' },
    { key: 'assists', title: '도움', unit: '도움' },
  ];
  const statTable = rankPlayers(playerStats, 'points', nameOrDash).concat(
    playerStats
      .filter((r) => r.points === 0)
      .sort((a, b) => b.quarters - a.quarters || nameOrDash(a.member_id).localeCompare(nameOrDash(b.member_id), 'ko'))
      .map((r) => ({ ...r, rank: 0 })),
  );

  const attendance = computeAttendanceKing(checkins, pastDays, nameOrDash);

  const handleOpenTeam = (id: string) => setTeamParam(id);

  const handleCloseTeam = () => {
    if (window.history.length > 1) router.back();
    else setTeamParam(null);
  };

  const handleCloseMiniGame = () => {
    if (window.history.length > 1) router.back();
    else setMiniGameParam(null);
  };

  const miniGameForm =
    miniGameMode === 'new' ? (
      <MiniGameForm seasonId={season.id} onDone={handleCloseMiniGame} />
    ) : miniGameMode === 'result' && editingMiniGame ? (
      <MiniGameResultForm key={`${editingMiniGame.id}-${teams?.length}`} game={editingMiniGame} canRemove={isAdmin} onDone={handleCloseMiniGame} />
    ) : null;
  const miniGameTitle = miniGameMode === 'new' ? '미니게임 추가' : editingMiniGame ? `${editingMiniGame.name} 결과` : '';

  const teamForm = teamFormOpen ? (
    <LeagueTeamForm key={teamParam} seasonId={season.id} team={editingTeam} hasSchedule={hasSchedule} onDone={handleCloseTeam} />
  ) : null;

  const handleAdvance = async () => {
    if (!next) return;
    try {
      await updateSeason.mutateAsync({ id: season.id, data: { status: next.status } });
      await refetch();
      toast.success(`${SEASON_STATUS_LABELS[next.status]}으로 바꿨어요.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '상태를 바꾸지 못했습니다.');
    }
  };

  const facts: { label: string; value: string }[] = [
    { label: '기간', value: formatSeasonRange(season) },
    { label: '경기 방식', value: formatSeasonFormat(season) },
    { label: '승점', value: formatSeasonPoints(season) },
    { label: '동률 처리', value: season.tiebreakers.map((t) => TIEBREAKER_LABELS[t]).join(' → ') },
    { label: 'MVP', value: MVP_METHOD_LABELS[season.mvp_method] },
  ];

  return (
    <article className="flex flex-col gap-6" aria-labelledby="season-title">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge tone={SEASON_STATUS_TONES[season.status]}>{SEASON_STATUS_LABELS[season.status]}</StatusBadge>
        </div>
        <h2 id="season-title" className="text-[22px] font-bold text-ink">
          {season.name}
        </h2>
        {isAdmin && next && (
          <Button variant="outline" className="h-11 self-start" onClick={handleAdvance} disabled={updateSeason.isPending}>
            {next.label}
          </Button>
        )}
      </header>

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-border bg-border sm:grid-cols-2">
        {facts.map((fact, index) => (
          <div
            key={fact.label}
            className={cn('flex flex-col gap-1 bg-background p-4', index === facts.length - 1 && facts.length % 2 === 1 && 'sm:col-span-2')}
          >
            <dt className="text-[12px] font-medium text-ink-dim">{fact.label}</dt>
            <dd className="text-[15px] font-semibold tabular-nums text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-3" aria-labelledby="season-teams">
        <div className="flex items-center justify-between gap-3">
          <h3 id="season-teams" className="text-[17px] font-bold text-ink">
            팀 {teams ? `(${teams.length})` : ''}
          </h3>
          {isAdmin && (
            <Button variant="outline" className="h-11" onClick={() => handleOpenTeam(TEAM_NEW)}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              팀 추가
            </Button>
          )}
        </div>

        {isDesktop && teamForm && (
          <div className="flex flex-col gap-4 rounded-[14px] border border-brand/40 bg-sunken/40 p-5" aria-labelledby="team-panel-title">
            <div className="flex items-center justify-between gap-3">
              <h4 id="team-panel-title" className="text-[15px] font-bold text-ink">
                {editingTeam ? `${editingTeam.name} 수정` : '새 팀'}
              </h4>
              <Button variant="ghost" size="icon" className="h-11 w-11" onClick={handleCloseTeam} aria-label="팀 편집 닫기">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {teamForm}
          </div>
        )}

        {teams && teams.length > 0 ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="팀 목록">
            {teams.map((team) => {
              const captain = memberName(team.captain_member_id);
              const body = (
                <>
                  <span
                    aria-hidden
                    className="h-4 w-4 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-ink">{team.name}</span>
                    <span className="truncate text-[12px] text-ink-dim">
                      {teamColorLabel(team.color)} · {captain ? `팀장 ${captain}` : '팀장 미정'}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={team.id}>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => handleOpenTeam(team.id)}
                      aria-current={team.id === teamParam ? 'true' : undefined}
                      className={cn(
                        'flex min-h-[52px] w-full items-center gap-3 rounded-[12px] border px-3 py-2 text-left outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring',
                        team.id === teamParam ? 'border-brand' : 'border-border',
                      )}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="flex min-h-[52px] items-center gap-3 rounded-[12px] border border-border px-3 py-2">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Shirt}
            title="아직 팀이 없어요"
            description={isAdmin ? '팀 추가로 팀과 팀장을 정하세요. 3팀이 기본입니다.' : '운영진이 팀과 팀장을 정하면 이곳에 보입니다.'}
          />
        )}
      </section>

      {teams && teams.length > 1 && (
        <section className="flex flex-col gap-3" aria-labelledby="season-standings">
          <h3 id="season-standings" className="flex items-center gap-2 text-[17px] font-bold text-ink">
            <Trophy className="h-4 w-4" aria-hidden />
            순위
          </h3>
          <div className="overflow-x-auto rounded-[14px] border border-border">
            <table className="w-full text-sm tabular-nums" aria-label="시즌 순위">
              <thead className="bg-sunken text-[12px] text-ink-dim">
                <tr>
                  <th scope="col" className="w-10 px-3 py-2 text-left font-medium">#</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">팀</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">경기</th>
                  {isDesktop && (
                    <>
                      <th scope="col" className="px-2 py-2 text-right font-medium">승</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">무</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">패</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">득점</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">실점</th>
                    </>
                  )}
                  <th scope="col" className="px-2 py-2 text-right font-medium">득실</th>
                  {hasMiniGames && (
                    <>
                      {isDesktop && <th scope="col" className="px-2 py-2 text-right font-medium">경기 승점</th>}
                      <th scope="col" className="px-2 py-2 text-right font-medium">{isDesktop ? '미니게임' : '미니'}</th>
                    </>
                  )}
                  <th scope="col" className="px-3 py-2 text-right font-medium">승점</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr key={row.team.id} className="border-t border-border">
                    <td className="px-3 py-2.5 font-semibold text-ink">{row.rank}</td>
                    <th scope="row" className="px-3 py-2.5 text-left font-semibold text-ink">
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.team.color }} />
                        {row.team.name}
                      </span>
                    </th>
                    <td className="px-2 py-2.5 text-right text-ink-dim">{row.played}</td>
                    {isDesktop && (
                      <>
                        <td className="px-2 py-2.5 text-right text-ink-dim">{row.won}</td>
                        <td className="px-2 py-2.5 text-right text-ink-dim">{row.drawn}</td>
                        <td className="px-2 py-2.5 text-right text-ink-dim">{row.lost}</td>
                        <td className="px-2 py-2.5 text-right text-ink-dim">{row.goals_for}</td>
                        <td className="px-2 py-2.5 text-right text-ink-dim">{row.goals_against}</td>
                      </>
                    )}
                    <td className="px-2 py-2.5 text-right text-ink-dim">{row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}</td>
                    {hasMiniGames && (
                      <>
                        {isDesktop && <td className="px-2 py-2.5 text-right text-ink-dim">{row.match_points}</td>}
                        <td className="px-2 py-2.5 text-right text-ink-dim">{row.minigame_points}</td>
                      </>
                    )}
                    <td className="px-3 py-2.5 text-right font-bold text-ink">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-ink-dim">
            끝난 경기만 반영돼요. 골 기록을 고치면 순위가 바로 다시 계산됩니다.
            {hasMiniGames && ' 승점은 경기 승점 + 미니게임 승점의 합계예요.'}
          </p>
        </section>
      )}

      {teams && teams.length > 1 && (
        <section className="flex flex-col gap-3" aria-labelledby="season-minigames">
          <div className="flex items-center justify-between gap-3">
            <h3 id="season-minigames" className="flex items-center gap-2 text-[17px] font-bold text-ink">
              <Target className="h-4 w-4" aria-hidden />
              미니게임 {hasMiniGames ? `(${miniGames.length})` : ''}
            </h3>
            {isAdmin && (
              <Button variant="outline" className="h-11" onClick={() => setMiniGameParam(MINIGAME_NEW)}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                미니게임 추가
              </Button>
            )}
          </div>

          {isDesktop && miniGameForm && (
            <div className="flex flex-col gap-4 rounded-[14px] border border-brand/40 bg-sunken/40 p-5" aria-labelledby="minigame-panel-title">
              <div className="flex items-center justify-between gap-3">
                <h4 id="minigame-panel-title" className="text-[15px] font-bold text-ink">
                  {miniGameTitle}
                </h4>
                <Button variant="ghost" size="icon" className="h-11 w-11" onClick={handleCloseMiniGame} aria-label="미니게임 패널 닫기">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {miniGameForm}
            </div>
          )}

          {!hasMiniGames ? (
            <EmptyState
              icon={Target}
              title="아직 미니게임이 없어요"
              description={isAdmin ? '승부차기·크로스바처럼 경기 외 종목을 추가하면 우승 팀에 승점을 줍니다.' : '운영진이 종목을 정하면 이곳에 보입니다.'}
            />
          ) : isDesktop ? (
            <div className="overflow-x-auto rounded-[14px] border border-border">
              <table className="w-full text-sm" aria-label="미니게임">
                <thead className="bg-sunken text-left text-[12px] text-ink-dim">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium">종목</th>
                    <th scope="col" className="px-4 py-2 font-medium">경기일</th>
                    <th scope="col" className="px-4 py-2 font-medium">승점</th>
                    <th scope="col" className="px-4 py-2 font-medium">결과</th>
                    {canRecordMiniGame && <th scope="col" className="w-0 px-4 py-2" aria-label="결과 입력" />}
                  </tr>
                </thead>
                <tbody>
                  {miniGames.map((game) => (
                    <tr key={game.id} className={cn('border-t border-border', game.id === miniGameParam && 'bg-sunken/60')}>
                      <th scope="row" className="px-4 py-3 text-left font-semibold text-ink">
                        {game.name}
                        {game.description && <span className="block text-[12px] font-normal text-ink-dim">{game.description}</span>}
                      </th>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-dim">{matchdayLabel(game)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-dim">{formatMiniGamePoints(game.points)}</td>
                      <td className={cn('px-4 py-3', game.results.length ? 'font-semibold text-ink' : 'text-ink-dim')}>{resultLabel(game)}</td>
                      {canRecordMiniGame && (
                        <td className="px-4 py-2 text-right">
                          <Button variant="outline" className="h-9 whitespace-nowrap" onClick={() => setMiniGameParam(game.id)}>
                            {game.results.length ? '결과 수정' : '결과 입력'}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="flex flex-col gap-2" aria-label="미니게임">
              {miniGames.map((game) => {
                const body = (
                  <>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink">{game.name}</span>
                        <span className="shrink-0 text-[12px] tabular-nums text-ink-dim">{matchdayLabel(game)}</span>
                      </span>
                      <span className="truncate text-[12px] text-ink-dim">{formatMiniGamePoints(game.points)}</span>
                      <span className={cn('truncate text-[13px]', game.results.length ? 'font-semibold text-ink' : 'text-ink-dim')}>
                        {resultLabel(game)}
                      </span>
                    </span>
                    {canRecordMiniGame && <ChevronRight className="h-4 w-4 shrink-0 text-ink-dim" aria-hidden />}
                  </>
                );
                return (
                  <li key={game.id}>
                    {canRecordMiniGame ? (
                      <button
                        type="button"
                        onClick={() => setMiniGameParam(game.id)}
                        aria-label={`${game.name} 결과 입력`}
                        className="flex min-h-[64px] w-full items-center gap-3 rounded-[12px] border border-border px-4 py-3 text-left outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="flex min-h-[64px] items-center gap-3 rounded-[12px] border border-border px-4 py-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {playerStats.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="season-players">
          <h3 id="season-players" className="flex items-center gap-2 text-[17px] font-bold text-ink">
            <Medal className="h-4 w-4" aria-hidden />
            개인 기록
          </h3>
          {isDesktop ? (
            <div className="max-h-[420px] overflow-auto rounded-[14px] border border-border">
              <table className="w-full text-sm tabular-nums" aria-label="개인 기록">
                <thead className="sticky top-0 bg-sunken text-[12px] text-ink-dim">
                  <tr>
                    <th scope="col" className="w-10 px-3 py-2 text-left font-medium">#</th>
                    <th scope="col" className="px-3 py-2 text-left font-medium">선수</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">출전 쿼터</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">골</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">도움</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">공격포인트</th>
                  </tr>
                </thead>
                <tbody>
                  {statTable.map((row) => (
                    <tr key={row.member_id} className="border-t border-border">
                      <td className="px-3 py-2 font-semibold text-ink">{row.rank || '–'}</td>
                      <th scope="row" className="px-3 py-2 text-left font-semibold text-ink">
                        {nameOrDash(row.member_id)}
                      </th>
                      <td className="px-2 py-2 text-right text-ink-dim">{row.quarters}</td>
                      <td className="px-2 py-2 text-right text-ink-dim">{row.goals}</td>
                      <td className="px-2 py-2 text-right text-ink-dim">{row.assists}</td>
                      <td className="px-3 py-2 text-right font-bold text-ink">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {leaders.map(({ key, title, unit }) => {
                const top = rankPlayers(playerStats, key, nameOrDash).slice(0, 3);
                return (
                  <section key={key} aria-label={`${title} 순위`} className="flex flex-col gap-2 rounded-[14px] border border-border p-3">
                    <h4 className="text-[13px] font-semibold text-ink-dim">{title} TOP 3</h4>
                    {top.length === 0 ? (
                      <p className="text-[13px] text-ink-dim">아직 없어요</p>
                    ) : (
                      <ol className="flex flex-col gap-1.5">
                        {top.map((r) => (
                          <li key={r.member_id} className="flex items-center gap-2 text-sm">
                            <span className="w-4 shrink-0 font-bold tabular-nums text-ink-dim">{r.rank}</span>
                            <span className="min-w-0 flex-1 truncate font-semibold text-ink">{nameOrDash(r.member_id)}</span>
                            <span className="shrink-0 tabular-nums text-ink">
                              {r[key]}
                              <span className="text-[11px] text-ink-dim">{unit}</span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                );
              })}
            </div>
          )}
          <p className="text-[12px] text-ink-dim">자책골은 개인 기록에 넣지 않아요. 출전 쿼터는 경기 화면의 출전 명단에서 셉니다.</p>
        </section>
      )}

      {hasSchedule && (
        <section className="flex flex-col gap-3" aria-labelledby="season-attendance">
          <h3 id="season-attendance" className="flex items-center gap-2 text-[17px] font-bold text-ink">
            <Crown className="h-4 w-4" aria-hidden />
            출석왕
          </h3>
          {pastDays.length === 0 ? (
            <p className="text-[13px] text-ink-dim">첫 경기일이 지나면 출석 순위가 쌓여요.</p>
          ) : checkinsError ? (
            <p className="text-[13px] text-ink-dim">출석 기록을 불러오지 못했어요.</p>
          ) : checkinsLoading ? (
            <CardSkeleton count={1} />
          ) : attendance.length === 0 ? (
            <p className="text-[13px] text-ink-dim">지난 경기일 {pastDays.length}번에 체크인 기록이 없어요.</p>
          ) : isDesktop ? (
            <div className="max-h-[420px] overflow-auto rounded-[14px] border border-border">
              <table className="w-full text-sm tabular-nums" aria-label="출석왕">
                <thead className="sticky top-0 bg-sunken text-[12px] text-ink-dim">
                  <tr>
                    <th scope="col" className="w-10 px-3 py-2 text-left font-medium">#</th>
                    <th scope="col" className="px-3 py-2 text-left font-medium">선수</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">정시</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">지각</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">출석률</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">연속 정시</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">최고 연속</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row) => (
                    <tr key={row.member_id} className="border-t border-border">
                      <td className="px-3 py-2 font-semibold text-ink">{row.rank}</td>
                      <th scope="row" className="px-3 py-2 text-left font-semibold text-ink">
                        {nameOrDash(row.member_id)}
                      </th>
                      <td className="px-2 py-2 text-right font-bold text-ink">{row.on_time}</td>
                      <td className="px-2 py-2 text-right text-ink-dim">{row.late}</td>
                      <td className="px-2 py-2 text-right text-ink-dim">{Math.round((row.attended / pastDays.length) * 100)}%</td>
                      <td className="px-2 py-2 text-right text-ink-dim">{row.streak}</td>
                      <td className="px-3 py-2 text-right text-ink-dim">{row.best_streak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ol className="flex flex-col gap-1.5 rounded-[14px] border border-border p-3" aria-label="출석왕">
              {attendance.slice(0, 5).map((row) => (
                <li key={row.member_id} className="flex min-h-[32px] items-center gap-2 text-sm">
                  <span className="w-4 shrink-0 font-bold tabular-nums text-ink-dim">{row.rank}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-ink">{nameOrDash(row.member_id)}</span>
                  <span className="shrink-0 tabular-nums text-ink">
                    정시 {row.on_time}
                    <span className="text-[11px] text-ink-dim">/{pastDays.length}</span>
                  </span>
                  {row.streak >= 2 && (
                    <span className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink">{row.streak}연속</span>
                  )}
                </li>
              ))}
            </ol>
          )}
          <p className="text-[12px] text-ink-dim">경기일 06:30까지 체크인하면 정시예요. 지각·결석은 연속 정시를 끊어요.</p>
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="season-schedule">
        <h3 id="season-schedule" className="text-[17px] font-bold text-ink">
          일정
        </h3>
        {hasSchedule && <p className="text-[13px] text-ink-dim">경기를 누르면 골을 기록하거나 결과를 볼 수 있어요.</p>}
        {isAdmin && (
          <ScheduleGenerateForm
            key={season.starts_on}
            seasonId={season.id}
            startsOn={season.starts_on}
            teamCount={teams?.length ?? 0}
            hasSchedule={hasSchedule}
          />
        )}
        {schedule && hasSchedule ? (
          isDesktop ? (
            <div className="overflow-x-auto rounded-[14px] border border-border">
              <table className="w-full text-sm" aria-label="시즌 일정">
                <thead className="bg-sunken text-left text-[12px] text-ink-dim">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium">주차</th>
                    <th scope="col" className="px-4 py-2 font-medium">날짜</th>
                    <th scope="col" className="px-4 py-2 font-medium">경기</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.matchdays.map((day) => (
                    <tr key={day.id} className="border-t border-border align-top">
                      <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-semibold text-ink">
                        {day.week}주차
                      </th>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-dim">{day.date.replaceAll('-', '.')}</td>
                      <td className="px-4 py-3">
                        <ol className="flex flex-wrap gap-2">
                          {schedule.fixtures
                            .filter((f) => f.matchday_id === day.id)
                            .map((f) => (
                              <li key={f.id}>
                                <Link
                                  href={`/seasons/${season.id}/fixtures/${f.id}`}
                                  className="inline-flex min-h-[36px] items-center rounded-[10px] bg-sunken px-3 py-1.5 text-ink outline-none hover:bg-sunken-strong focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <FixtureLabel fixture={f} goals={goals} home={teamName(f.home_team_id)} away={teamName(f.away_team_id)} homeColor={teamColor(f.home_team_id)} awayColor={teamColor(f.away_team_id)} />
                                </Link>
                              </li>
                            ))}
                        </ol>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ol className="flex flex-col gap-2" aria-label="시즌 일정">
              {schedule.matchdays.map((day) => {
                const dayFixtures = schedule.fixtures.filter((f) => f.matchday_id === day.id);
                return (
                  <li key={day.id} className="flex flex-col gap-2 rounded-[12px] border border-border px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">{day.week}주차</span>
                      <span className="text-sm tabular-nums text-ink-dim">
                        {day.date.replaceAll('-', '.')} · {dayFixtures.length}경기
                      </span>
                    </div>
                    <ol className="flex flex-col gap-1">
                      {dayFixtures.map((f) => (
                        <li key={f.id}>
                          <Link
                            href={`/seasons/${season.id}/fixtures/${f.id}`}
                            className="flex min-h-[44px] items-center justify-between gap-2 rounded-[10px] px-1 text-[13px] text-ink outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <FixtureLabel fixture={f} goals={goals} home={teamName(f.home_team_id)} away={teamName(f.away_team_id)} homeColor={teamColor(f.home_team_id)} awayColor={teamColor(f.away_team_id)} />
                            <ChevronRight className="h-4 w-4 shrink-0 text-ink-dim" aria-hidden />
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </li>
                );
              })}
            </ol>
          )
        ) : (
          <EmptyState icon={CalendarDays} title="아직 일정이 없어요" description="팀이 정해지면 4주 × 3경기 일정을 자동으로 만듭니다." />
        )}
      </section>

      {isDesktop === false && (
        <Drawer open={!!miniGameForm} onOpenChange={(open) => (open ? undefined : handleCloseMiniGame())}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader>
              <DrawerTitle>{miniGameTitle}</DrawerTitle>
              <DrawerDescription>{miniGameMode === 'new' ? '종목과 등수별 승점을 정합니다.' : '팀마다 등수를 고르세요. 같은 등수는 공동입니다.'}</DrawerDescription>
            </DrawerHeader>
            {miniGameForm}
          </DrawerContent>
        </Drawer>
      )}

      {isDesktop === false && (
        <Drawer open={teamFormOpen} onOpenChange={(open) => (open ? undefined : handleCloseTeam())}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader>
              <DrawerTitle>{editingTeam ? `${editingTeam.name} 수정` : '새 팀'}</DrawerTitle>
              <DrawerDescription>팀 이름, 조끼 색, 팀장을 정합니다.</DrawerDescription>
            </DrawerHeader>
            {teamForm}
          </DrawerContent>
        </Drawer>
      )}
    </article>
  );
}

function FixtureLabel({
  fixture,
  goals,
  home,
  away,
  homeColor,
  awayColor,
}: {
  fixture: Fixture;
  goals: GoalEvent[];
  home: string;
  away: string;
  homeColor: string;
  awayColor: string;
}) {
  const score = fixture.status === 'scheduled' ? null : fixtureScore(fixture, goals);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular-nums text-ink-dim">{fixture.order}경기</span>
      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: homeColor }} />
      <span className="font-semibold">{home}</span>
      {score ? (
        <span className="font-bold tabular-nums">
          {score.home}:{score.away}
        </span>
      ) : (
        <span className="text-ink-dim">vs</span>
      )}
      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: awayColor }} />
      <span className="font-semibold">{away}</span>
      {fixture.status === 'live' && <span className="text-[11px] font-bold text-signal-red-fg">진행 중</span>}
    </span>
  );
}
