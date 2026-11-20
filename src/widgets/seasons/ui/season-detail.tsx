'use client';

import { useRouter } from 'next/navigation';
import { CalendarDays, Plus, Shirt, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  MVP_METHOD_LABELS,
  SEASON_STATUS_LABELS,
  SEASON_STATUS_TONES,
  TIEBREAKER_LABELS,
  formatSeasonFormat,
  formatSeasonPoints,
  formatSeasonRange,
  teamColorLabel,
} from '@/entities/league/model/labels';
import { useLeagueSchedule, useLeagueTeams, useSeason, useUpdateSeason } from '@/entities/league/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { ScheduleGenerateForm } from '@/features/league-schedule-generate/ui/schedule-generate-form';
import { LeagueTeamForm } from '@/features/league-team-edit/ui/league-team-form';
import { useAuth } from '@/providers/auth-provider';
import { DESKTOP_QUERY, useMediaQuery } from '@/shared/lib/use-media-query';
import { useUrlState } from '@/shared/lib/use-url-state';
import { cn } from '@/shared/lib/utils';
import type { SeasonStatus } from '@/shared/types/league';
import { Button } from '@/shared/ui/button';
import { CardSkeleton } from '@/shared/ui/card-skeleton';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer';
import { EmptyState, ErrorState } from '@/shared/ui/empty-state';
import { StatusBadge } from '@/shared/ui/status-badge';

const TEAM_NEW = 'new';

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
 */
export function SeasonDetail({ seasonId }: SeasonDetailProps) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { data: season, isLoading, error, refetch } = useSeason(seasonId);
  const { data: teams } = useLeagueTeams(seasonId);
  const { data: schedule } = useLeagueSchedule(seasonId);
  const { data: members } = useMembers();
  const updateSeason = useUpdateSeason();
  const [teamParam, setTeamParam] = useUrlState('team');
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  if (isLoading) return <CardSkeleton count={2} />;
  if (error || !season) {
    return <ErrorState title="시즌을 불러오지 못했어요" description={error?.message} onRetry={() => refetch()} />;
  }

  const next = NEXT_STATUS[season.status];
  const hasSchedule = !!schedule && schedule.matchdays.length > 0;
  const editingTeam = teamParam && teamParam !== TEAM_NEW ? (teams?.find((t) => t.id === teamParam) ?? null) : null;
  // 팀 목록이 아직 없으면 수정 대상을 모르므로 폼을 열지 않는다.
  const teamFormOpen = isAdmin && (teamParam === TEAM_NEW || !!editingTeam);
  const teamName = (id: string) => teams?.find((t) => t.id === id)?.name ?? '?';
  const teamColor = (id: string) => teams?.find((t) => t.id === id)?.color ?? 'transparent';
  const memberName = (id: string | null) => (id ? (members?.find((m) => m.id === id)?.name ?? null) : null);

  const handleOpenTeam = (id: string) => setTeamParam(id);

  const handleCloseTeam = () => {
    if (window.history.length > 1) router.back();
    else setTeamParam(null);
  };

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

      <section className="flex flex-col gap-3" aria-labelledby="season-schedule">
        <h3 id="season-schedule" className="text-[17px] font-bold text-ink">
          일정
        </h3>
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
                              <li key={f.id} className="rounded-[10px] bg-sunken px-3 py-1.5 text-ink">
                                <FixtureLabel order={f.order} home={teamName(f.home_team_id)} away={teamName(f.away_team_id)} homeColor={teamColor(f.home_team_id)} awayColor={teamColor(f.away_team_id)} />
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
                        <li key={f.id} className="text-[13px] text-ink">
                          <FixtureLabel order={f.order} home={teamName(f.home_team_id)} away={teamName(f.away_team_id)} homeColor={teamColor(f.home_team_id)} awayColor={teamColor(f.away_team_id)} />
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

function FixtureLabel({ order, home, away, homeColor, awayColor }: { order: number; home: string; away: string; homeColor: string; awayColor: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular-nums text-ink-dim">{order}경기</span>
      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: homeColor }} />
      <span className="font-semibold">{home}</span>
      <span className="text-ink-dim">vs</span>
      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: awayColor }} />
      <span className="font-semibold">{away}</span>
    </span>
  );
}
