'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { seasonWeeks, shortDate } from '@/entities/league/model/availability';
import { useLeagueAvailability, useLeagueSchedule, useSeason, useSetAvailability } from '@/entities/league/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

interface AvailabilityFormProps {
  seasonId: string;
  memberId: string;
  /** 폼 이름(접근성 이름)에 쓰는 회원 이름. 본인이면 '내' */
  label: string;
  /** 저장 뒤 시트·패널을 닫을 때 */
  onDone?: () => void;
}

interface AvailabilityFormData {
  weeks: number[];
}

/**
 * 참석 가능 주차 입력(스펙 §2.1: 시즌 시작 전 전원 입력 → 드래프트 선수 카드에 보임).
 * 주차 버튼을 켜고 끈 뒤 저장한다. 모두 끄고 저장하면 "못 옴"으로 남는다.
 */
export function AvailabilityForm({ seasonId, memberId, label, onDone }: AvailabilityFormProps) {
  const { user } = useAuth();
  const { data: season } = useSeason(seasonId);
  const { data: schedule } = useLeagueSchedule(seasonId);
  const { data: rows = [] } = useLeagueAvailability(seasonId);
  const setAvailability = useSetAvailability();
  const saved = rows.find((r) => r.member_id === memberId);
  const { handleSubmit, watch, setValue } = useForm<AvailabilityFormData>({
    values: { weeks: saved?.weeks ?? [] },
    resetOptions: { keepDirtyValues: true },
  });
  const selected = watch('weeks') ?? [];
  if (!season) return null;
  const weeks = seasonWeeks(season, schedule?.matchdays ?? []);

  const handleToggle = (week: number) => {
    const next = selected.includes(week) ? selected.filter((w) => w !== week) : [...selected, week].sort((a, b) => a - b);
    setValue('weeks', next, { shouldDirty: true });
  };

  const handleAll = () => {
    setValue('weeks', selected.length === weeks.length ? [] : weeks.map((w) => w.week), { shouldDirty: true });
  };

  const handleFormSubmit = async (data: AvailabilityFormData) => {
    try {
      await setAvailability.mutateAsync({ season_id: seasonId, member_id: memberId, weeks: data.weeks, actor_id: user?.id ?? null });
      toast.success(data.weeks.length === 0 ? '이번 시즌은 못 온다고 저장했어요.' : `참석 가능 ${data.weeks.length}주를 저장했어요.`);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '참석 가능 주차를 저장하지 못했습니다.');
    }
  };

  const pending = setAvailability.isPending;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-3" aria-label={`${label} 참석 가능 주차`}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="주차">
        {weeks.map(({ week, date }) => {
          const on = selected.includes(week);
          return (
            <button
              key={week}
              type="button"
              aria-pressed={on}
              disabled={pending}
              onClick={() => handleToggle(week)}
              className={cn(
                'flex min-h-[52px] flex-col items-center justify-center rounded-[12px] border text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                on ? 'border-brand bg-brand/10 font-bold text-ink' : 'border-border text-ink-dim hover:bg-sunken',
              )}
            >
              {week}주차
              <span className="text-[11px] font-normal tabular-nums">{shortDate(date)}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="h-11 flex-1" onClick={handleAll} disabled={pending}>
          {selected.length === weeks.length ? '모두 끄기' : '전부 가능'}
        </Button>
        <Button type="submit" className="h-11 flex-1" disabled={pending}>
          {pending ? '저장하는 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}
