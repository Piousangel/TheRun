'use client';

import { CalendarDays, Shirt } from 'lucide-react';
import { toast } from 'sonner';
import {
  MVP_METHOD_LABELS,
  SEASON_STATUS_LABELS,
  SEASON_STATUS_TONES,
  TIEBREAKER_LABELS,
  formatSeasonFormat,
  formatSeasonPoints,
  formatSeasonRange,
} from '@/entities/league/model/labels';
import { useLeagueSchedule, useLeagueTeams, useSeason, useUpdateSeason } from '@/entities/league/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/shared/lib/utils';
import type { SeasonStatus } from '@/shared/types/league';
import { Button } from '@/shared/ui/button';
import { CardSkeleton } from '@/shared/ui/card-skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/empty-state';
import { StatusBadge } from '@/shared/ui/status-badge';

const NEXT_STATUS: Partial<Record<SeasonStatus, { status: SeasonStatus; label: string }>> = {
  draft: { status: 'active', label: '시즌 시작' },
  active: { status: 'done', label: '시즌 종료' },
};

interface SeasonDetailProps {
  seasonId: string;
}

export function SeasonDetail({ seasonId }: SeasonDetailProps) {
  const { isAdmin } = useAuth();
  const { data: season, isLoading, error, refetch } = useSeason(seasonId);
  const { data: teams } = useLeagueTeams(seasonId);
  const { data: schedule } = useLeagueSchedule(seasonId);
  const updateSeason = useUpdateSeason();

  if (isLoading) return <CardSkeleton count={2} />;
  if (error || !season) {
    return <ErrorState title="시즌을 불러오지 못했어요" description={error?.message} onRetry={() => refetch()} />;
  }

  const next = NEXT_STATUS[season.status];

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
        <h3 id="season-teams" className="text-[17px] font-bold text-ink">
          팀 {teams ? `(${teams.length})` : ''}
        </h3>
        {teams && teams.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {teams.map((team) => (
              <li key={team.id} className="flex min-h-[44px] items-center gap-2 rounded-[12px] border border-border px-3 py-2">
                <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: team.color }} />
                <span className="truncate text-sm font-semibold text-ink">{team.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Shirt} title="아직 팀이 없어요" description="팀장을 정하고 드래프트를 하면 이곳에 팀이 생깁니다." />
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="season-schedule">
        <h3 id="season-schedule" className="text-[17px] font-bold text-ink">
          일정
        </h3>
        {schedule && schedule.matchdays.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {schedule.matchdays.map((day) => {
              const count = schedule.fixtures.filter((f) => f.matchday_id === day.id).length;
              return (
                <li key={day.id} className="flex min-h-[44px] items-center justify-between rounded-[12px] border border-border px-4 py-3">
                  <span className="text-sm font-semibold text-ink">{day.week}주차</span>
                  <span className="text-sm tabular-nums text-ink-dim">
                    {day.date.replaceAll('-', '.')} · {count}경기
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState icon={CalendarDays} title="아직 일정이 없어요" description="팀이 정해지면 4주 × 3경기 일정을 자동으로 만듭니다." />
        )}
      </section>
    </article>
  );
}
