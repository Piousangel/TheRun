'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { addWeeks, format, nextSaturday } from 'date-fns';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCreateSeason } from '@/entities/league/model/queries';
import { seasonCreateSchema, type SeasonCreateFormData } from '@/features/season-create/model/schema';
import type { Season } from '@/shared/types/league';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface SeasonCreateFormProps {
  onCreated: (season: Season) => void;
}

function defaultValues(): SeasonCreateFormData {
  const start = nextSaturday(new Date());
  return {
    name: `${format(start, 'yyyy')} 시즌`,
    starts_on: format(start, 'yyyy-MM-dd'),
    ends_on: format(addWeeks(start, 3), 'yyyy-MM-dd'),
    quarters_per_match: 3,
    quarter_minutes: 10,
    players_per_side: 6,
    win: 3,
    draw: 1,
    loss: 0,
  };
}

const NUMBER_FIELDS = [
  { name: 'quarters_per_match', label: '쿼터 수', suffix: '쿼터' },
  { name: 'quarter_minutes', label: '쿼터 시간', suffix: '분' },
  { name: 'players_per_side', label: '한 팀 인원', suffix: '명' },
] as const;

const POINT_FIELDS = [
  { name: 'win', label: '승' },
  { name: 'draw', label: '무' },
  { name: 'loss', label: '패' },
] as const;

export function SeasonCreateForm({ onCreated }: SeasonCreateFormProps) {
  const createSeason = useCreateSeason();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SeasonCreateFormData>({ resolver: zodResolver(seasonCreateSchema), defaultValues: defaultValues() });

  const handleFormSubmit = async (data: SeasonCreateFormData) => {
    try {
      const season = await createSeason.mutateAsync({
        name: data.name.trim(),
        starts_on: data.starts_on,
        ends_on: data.ends_on,
        quarters_per_match: data.quarters_per_match,
        quarter_minutes: data.quarter_minutes,
        players_per_side: data.players_per_side,
        points: { win: data.win, draw: data.draw, loss: data.loss },
      });
      toast.success(`'${season.name}' 시즌을 만들었어요.`);
      onCreated(season);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '시즌을 만들지 못했습니다.');
    }
  };

  const pending = createSeason.isPending;
  const pointError = errors.win ?? errors.draw ?? errors.loss;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5" aria-label="시즌 만들기">
      <div className="flex flex-col gap-2">
        <Label htmlFor="season-name">시즌 이름</Label>
        <Input id="season-name" {...register('name')} disabled={pending} autoComplete="off" className="h-11" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="season-starts">시작일</Label>
          <Input id="season-starts" type="date" {...register('starts_on')} disabled={pending} className="h-11" />
          {errors.starts_on && <p className="text-sm text-destructive">{errors.starts_on.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="season-ends">종료일</Label>
          <Input id="season-ends" type="date" {...register('ends_on')} disabled={pending} className="h-11" />
          {errors.ends_on && <p className="text-sm text-destructive">{errors.ends_on.message}</p>}
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-ink">경기 방식</legend>
        <div className="grid grid-cols-3 gap-3">
          {NUMBER_FIELDS.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={`season-${field.name}`} className="text-xs text-ink-dim">
                {field.label}({field.suffix})
              </Label>
              <Input
                id={`season-${field.name}`}
                type="number"
                inputMode="numeric"
                {...register(field.name, { valueAsNumber: true })}
                disabled={pending}
                className="h-11 tabular-nums"
              />
            </div>
          ))}
        </div>
        {NUMBER_FIELDS.map((field) =>
          errors[field.name] ? (
            <p key={field.name} className="text-sm text-destructive">
              {errors[field.name]?.message}
            </p>
          ) : null,
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-ink">승점</legend>
        <div className="grid grid-cols-3 gap-3">
          {POINT_FIELDS.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={`season-${field.name}`} className="text-xs text-ink-dim">
                {field.label}
              </Label>
              <Input
                id={`season-${field.name}`}
                type="number"
                inputMode="numeric"
                {...register(field.name, { valueAsNumber: true })}
                disabled={pending}
                className="h-11 tabular-nums"
              />
            </div>
          ))}
        </div>
        {pointError && <p className="text-sm text-destructive">{pointError.message}</p>}
        <p className="text-xs text-ink-dim">순위는 승점 → 득실차 → 다득점 → 승자승 순으로 정합니다.</p>
      </fieldset>

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? '만드는 중...' : '시즌 만들기'}
      </Button>
    </form>
  );
}
