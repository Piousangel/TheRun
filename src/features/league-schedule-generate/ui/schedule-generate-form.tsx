'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useGenerateSchedule } from '@/entities/league/model/queries';
import { scheduleGenerateSchema, type ScheduleGenerateFormData } from '@/features/league-schedule-generate/model/schema';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface ScheduleGenerateFormProps {
  seasonId: string;
  /** 기본 첫 경기일 = 시즌 시작일 */
  startsOn: string;
  teamCount: number;
  hasSchedule: boolean;
}

/** 팀 목록으로 라운드로빈 일정(기본 4주)을 만든다. 시작된 경기가 있으면 어댑터가 거부한다. */
export function ScheduleGenerateForm({ seasonId, startsOn, teamCount, hasSchedule }: ScheduleGenerateFormProps) {
  const generate = useGenerateSchedule();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleGenerateFormData>({
    resolver: zodResolver(scheduleGenerateSchema),
    defaultValues: { first_date: startsOn, weeks: 4 },
  });

  const handleFormSubmit = async (data: ScheduleGenerateFormData) => {
    if (hasSchedule && !window.confirm('지금 일정을 지우고 새로 만들까요?')) return;
    try {
      const result = await generate.mutateAsync({ seasonId, input: { first_date: data.first_date, weeks: data.weeks } });
      toast.success(`${result.matchdays.length}주 · ${result.fixtures.length}경기 일정을 만들었어요.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '일정을 만들지 못했습니다.');
    }
  };

  const tooFew = teamCount < 2;
  const pending = generate.isPending;

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      aria-label="일정 만들기"
      className="flex flex-col gap-3 rounded-[14px] border border-dashed border-border p-4"
    >
      <div className="grid grid-cols-[1fr_96px] gap-3 md:grid-cols-[1fr_120px_auto] md:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schedule-first-date" className="text-xs text-ink-dim">
            첫 경기일
          </Label>
          <Input id="schedule-first-date" type="date" {...register('first_date')} disabled={pending} className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schedule-weeks" className="text-xs text-ink-dim">
            경기일 수(주)
          </Label>
          <Input
            id="schedule-weeks"
            type="number"
            inputMode="numeric"
            {...register('weeks', { valueAsNumber: true })}
            disabled={pending}
            className="h-11 tabular-nums"
          />
        </div>
        <Button type="submit" className="col-span-2 h-11 md:col-span-1" disabled={pending || tooFew}>
          <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden />
          {hasSchedule ? '일정 다시 만들기' : '일정 자동 생성'}
        </Button>
      </div>
      {(errors.first_date || errors.weeks) && (
        <p className="text-sm text-destructive">{errors.first_date?.message ?? errors.weeks?.message}</p>
      )}
      <p className="text-xs text-ink-dim">
        {tooFew
          ? '팀이 2개 이상 있어야 일정을 만들 수 있어요.'
          : teamCount === 3
            ? '3팀이면 매주 A-B · A-C · B-C 세 경기를 합니다. 매주 같은 요일로 이어집니다.'
            : '라운드로빈으로 대진을 주차에 고르게 나눕니다. 매주 같은 요일로 이어집니다.'}
      </p>
    </form>
  );
}
