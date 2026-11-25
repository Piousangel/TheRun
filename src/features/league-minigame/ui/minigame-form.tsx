'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCreateMiniGame, useLeagueSchedule } from '@/entities/league/model/queries';
import { miniGameSchema, toMiniGamePoints, type MiniGameFormData } from '@/features/league-minigame/model/schema';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface MiniGameFormProps {
  seasonId: string;
  onDone: () => void;
}

const NATIVE_SELECT =
  'flex h-11 w-full rounded-xl border border-input/80 bg-background/90 px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 disabled:opacity-50';

const POINT_FIELDS = [
  { name: 'first', label: '우승' },
  { name: 'second', label: '2위' },
  { name: 'third', label: '3위' },
] as const;

/** 미니게임 종목 추가(운영진). 기본은 스펙 §5-3 '우승만 1점'. */
export function MiniGameForm({ seasonId, onDone }: MiniGameFormProps) {
  const { user } = useAuth();
  const { data: schedule } = useLeagueSchedule(seasonId);
  const createMiniGame = useCreateMiniGame();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MiniGameFormData>({
    resolver: zodResolver(miniGameSchema),
    defaultValues: { name: '', description: '', matchday_id: '', first: '1', second: '', third: '' },
  });

  const handleFormSubmit = async (data: MiniGameFormData) => {
    try {
      const game = await createMiniGame.mutateAsync({
        season_id: seasonId,
        name: data.name,
        description: data.description || null,
        matchday_id: data.matchday_id || null,
        points: toMiniGamePoints(data),
        actor_id: user?.id ?? null,
      });
      toast.success(`'${game.name}'을(를) 추가했어요.`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '미니게임을 추가하지 못했습니다.');
    }
  };

  const pending = createMiniGame.isPending;
  const pointError = errors.first ?? errors.second ?? errors.third;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5" aria-label="미니게임 추가">
      <div className="flex flex-col gap-2">
        <Label htmlFor="minigame-name">종목</Label>
        <Input id="minigame-name" placeholder="승부차기" {...register('name')} disabled={pending} autoComplete="off" className="h-11" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="minigame-description">설명 (선택)</Label>
        <Input id="minigame-description" placeholder="팀당 3명, 서든데스" {...register('description')} disabled={pending} autoComplete="off" className="h-11" />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="minigame-matchday">경기일 (선택)</Label>
        <select id="minigame-matchday" {...register('matchday_id')} disabled={pending} className={NATIVE_SELECT}>
          <option value="">아직 정하지 않음</option>
          {schedule?.matchdays.map((day) => (
            <option key={day.id} value={day.id}>
              {day.week}주차 · {day.date.replaceAll('-', '.')}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-ink">등수별 승점</legend>
        <div className="grid grid-cols-3 gap-2">
          {POINT_FIELDS.map((field) => (
            <div key={field.name} className="flex flex-col gap-1">
              <Label htmlFor={`minigame-${field.name}`} className="text-[12px] text-ink-dim">
                {field.label}
              </Label>
              <Input
                id={`minigame-${field.name}`}
                inputMode="numeric"
                placeholder={field.name === 'first' ? '1' : '없음'}
                {...register(field.name)}
                disabled={pending}
                className="h-11 tabular-nums"
              />
            </div>
          ))}
        </div>
        {pointError && <p className="text-sm text-destructive">{pointError.message}</p>}
        <p className="text-xs text-ink-dim">순위표에 &apos;미니게임 승점&apos;으로 따로 보이고 합계로 순위를 정합니다. 기본은 우승만 1점.</p>
      </fieldset>

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? '추가하는 중...' : '미니게임 추가'}
      </Button>
    </form>
  );
}
