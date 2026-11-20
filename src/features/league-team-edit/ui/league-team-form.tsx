'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { TEAM_COLORS } from '@/entities/league/model/labels';
import { useCreateLeagueTeam, useLeagueTeams, useRemoveLeagueTeam, useUpdateLeagueTeam } from '@/entities/league/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { findTeamConflict, leagueTeamSchema, type LeagueTeamFormData } from '@/features/league-team-edit/model/schema';
import { cn } from '@/shared/lib/utils';
import type { LeagueTeam } from '@/shared/types/league';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface LeagueTeamFormProps {
  seasonId: string;
  /** 있으면 수정, 없으면 새 팀 */
  team?: LeagueTeam | null;
  /** 일정이 이미 있으면 팀을 지울 수 없다(어댑터도 거부한다) */
  hasSchedule: boolean;
  onDone: () => void;
}

const NATIVE_SELECT =
  'flex h-11 w-full rounded-xl border border-input/80 bg-background/90 px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 disabled:opacity-50';

export function LeagueTeamForm({ seasonId, team, hasSchedule, onDone }: LeagueTeamFormProps) {
  const { data: teams = [] } = useLeagueTeams(seasonId);
  const { data: members = [] } = useMembers();
  const createTeam = useCreateLeagueTeam();
  const updateTeam = useUpdateLeagueTeam();
  const removeTeam = useRemoveLeagueTeam();

  const others = teams.filter((t) => t.id !== team?.id);
  const usedColors = new Set(others.map((t) => t.color.toLowerCase()));
  const firstFreeColor = TEAM_COLORS.find((c) => !usedColors.has(c.value.toLowerCase()))?.value ?? TEAM_COLORS[0].value;
  const takenCaptains = new Set(others.map((t) => t.captain_member_id).filter(Boolean));

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeagueTeamFormData>({
    resolver: zodResolver(leagueTeamSchema),
    defaultValues: {
      name: team?.name ?? `${String.fromCharCode(65 + teams.length)}팀`,
      color: team?.color ?? firstFreeColor,
      captain_member_id: team?.captain_member_id ?? '',
    },
  });
  const color = watch('color');

  const handleFormSubmit = async (data: LeagueTeamFormData) => {
    const conflict = findTeamConflict(data, others);
    if (conflict) {
      setError(conflict.field, { message: conflict.message });
      return;
    }
    const payload = { name: data.name.trim(), color: data.color, captain_member_id: data.captain_member_id || null };
    try {
      if (team) {
        await updateTeam.mutateAsync({ id: team.id, seasonId, data: payload });
        toast.success(`'${payload.name}'을(를) 고쳤어요.`);
      } else {
        await createTeam.mutateAsync({ season_id: seasonId, ...payload });
        toast.success(`'${payload.name}'을(를) 만들었어요.`);
      }
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '팀을 저장하지 못했습니다.');
    }
  };

  const handleRemove = async () => {
    if (!team) return;
    if (!window.confirm(`'${team.name}'을(를) 지울까요?`)) return;
    try {
      await removeTeam.mutateAsync({ id: team.id, seasonId });
      toast.success(`'${team.name}'을(를) 지웠어요.`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '팀을 지우지 못했습니다.');
    }
  };

  const pending = createTeam.isPending || updateTeam.isPending || removeTeam.isPending;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5" aria-label={team ? '팀 수정' : '팀 만들기'}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="team-name">팀 이름</Label>
        <Input id="team-name" {...register('name')} disabled={pending} autoComplete="off" className="h-11" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-ink">조끼 색</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="조끼 색">
          {TEAM_COLORS.map((option) => {
            const selected = color.toLowerCase() === option.value.toLowerCase();
            const taken = usedColors.has(option.value.toLowerCase());
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={taken ? `${option.label}(다른 팀 사용 중)` : option.label}
                disabled={pending}
                onClick={() => setValue('color', option.value, { shouldValidate: true })}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border-2 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected ? 'border-ink' : 'border-transparent',
                  taken && !selected && 'opacity-40',
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: option.value }}>
                  {selected && <Check className="h-4 w-4 text-white mix-blend-difference" aria-hidden />}
                </span>
              </button>
            );
          })}
        </div>
        {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="team-captain">팀장</Label>
        <select id="team-captain" {...register('captain_member_id')} disabled={pending} className={NATIVE_SELECT}>
          <option value="">아직 정하지 않음</option>
          {members.map((member) => (
            <option key={member.id} value={member.id} disabled={takenCaptains.has(member.id)}>
              {member.name}
              {takenCaptains.has(member.id) ? ' (다른 팀 팀장)' : ''}
            </option>
          ))}
        </select>
        {errors.captain_member_id && <p className="text-sm text-destructive">{errors.captain_member_id.message}</p>}
        <p className="text-xs text-ink-dim">팀장은 드래프트에서 자기 팀 선수를 뽑습니다.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? '저장하는 중...' : team ? '저장' : '팀 만들기'}
        </Button>
        {team && (
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full text-destructive"
            onClick={handleRemove}
            disabled={pending || hasSchedule}
          >
            팀 지우기
          </Button>
        )}
        {team && hasSchedule && <p className="text-xs text-ink-dim">일정이 만들어진 시즌에서는 팀을 지울 수 없습니다.</p>}
      </div>
    </form>
  );
}
