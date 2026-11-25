'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { formatMiniGamePoints } from '@/entities/league/model/labels';
import { useLeagueTeams, useRemoveMiniGame, useSetMiniGameResults } from '@/entities/league/model/queries';
import { toMiniGameResults } from '@/features/league-minigame/model/schema';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/shared/lib/utils';
import type { MiniGame } from '@/shared/types/league';
import { Button } from '@/shared/ui/button';

interface MiniGameResultFormProps {
  game: MiniGame;
  /** 운영진만 종목을 지울 수 있다 */
  canRemove: boolean;
  onDone: () => void;
}

interface ResultFormData {
  ranks: Record<string, string>;
}

/**
 * 미니게임 결과 입력. 팀마다 등수를 한 번 탭으로 고른다(같은 등수 = 공동). 결과는 통째로 저장되고 변경 이력에 남는다.
 */
export function MiniGameResultForm({ game, canRemove, onDone }: MiniGameResultFormProps) {
  const { user } = useAuth();
  const { data: teams = [] } = useLeagueTeams(game.season_id);
  const setResults = useSetMiniGameResults();
  const removeMiniGame = useRemoveMiniGame();
  const { handleSubmit, watch, setValue } = useForm<ResultFormData>({
    defaultValues: {
      ranks: Object.fromEntries(teams.map((t) => [t.id, String(game.results.find((r) => r.team_id === t.id)?.rank ?? '')])),
    },
  });
  const ranks = watch('ranks');
  const rankOptions = Array.from({ length: Math.max(teams.length, 1) }, (_, i) => i + 1);

  const handleFormSubmit = async (data: ResultFormData) => {
    try {
      await setResults.mutateAsync({ minigame_id: game.id, results: toMiniGameResults(data.ranks), actor_id: user?.id ?? null });
      toast.success(`'${game.name}' 결과를 저장했어요.`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '결과를 저장하지 못했습니다.');
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`'${game.name}'을(를) 지울까요? 결과와 승점도 사라집니다.`)) return;
    try {
      await removeMiniGame.mutateAsync({ id: game.id, seasonId: game.season_id, actorId: user?.id ?? null });
      toast.success(`'${game.name}'을(를) 지웠어요.`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '미니게임을 지우지 못했습니다.');
    }
  };

  const pending = setResults.isPending || removeMiniGame.isPending;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5" aria-label={`${game.name} 결과`}>
      <p className="text-[13px] text-ink-dim">
        {formatMiniGamePoints(game.points)}
        {game.description ? ` · ${game.description}` : ''}
      </p>
      <ul className="flex flex-col gap-3">
        {teams.map((team) => {
          const current = ranks?.[team.id] ?? '';
          return (
            <li key={team.id} className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                <span aria-hidden className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: team.color }} />
                {team.name}
              </span>
              <div className="flex gap-1.5" role="radiogroup" aria-label={`${team.name} 등수`}>
                {[...rankOptions.map(String), ''].map((value) => {
                  const selected = current === value;
                  const points = value === '' ? null : (game.points[Number(value) - 1] ?? 0);
                  return (
                    <button
                      key={value || 'none'}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={pending}
                      onClick={() => setValue(`ranks.${team.id}`, value, { shouldDirty: true })}
                      className={cn(
                        'flex min-h-[44px] flex-1 flex-col items-center justify-center rounded-[10px] border text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        selected ? 'border-brand bg-brand/10 font-bold text-ink' : 'border-border text-ink-dim hover:bg-sunken',
                      )}
                    >
                      {value === '' ? '없음' : `${value}위`}
                      {points !== null && points > 0 && <span className="text-[11px] tabular-nums">+{points}점</span>}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2">
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {setResults.isPending ? '저장하는 중...' : '결과 저장'}
        </Button>
        {canRemove && (
          <Button type="button" variant="ghost" className="h-11 w-full text-destructive" onClick={handleRemove} disabled={pending}>
            미니게임 지우기
          </Button>
        )}
      </div>
    </form>
  );
}
