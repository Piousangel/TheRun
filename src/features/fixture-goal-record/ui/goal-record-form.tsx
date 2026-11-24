'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAddGoal, useRemoveGoal } from '@/entities/league/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { newId } from '@/shared/lib/id';
import { cn } from '@/shared/lib/utils';
import type { Fixture, LeagueTeam } from '@/shared/types/league';
import { Button } from '@/shared/ui/button';

interface GoalRecordFormProps {
  seasonId: string;
  fixture: Fixture;
  teams: LeagueTeam[];
  quarter: number;
  /** 미리 고른 득점 팀(모바일에서 팀 버튼으로 열었을 때) */
  initialTeamId?: string | null;
  /** 기록을 마치면 부른다(모바일 시트 닫기). 데스크톱 패널은 그대로 두고 처음 단계로 돌아간다. */
  onDone?: () => void;
}

const NONE = '__none__';

/**
 * [골] → 팀 → 득점자 → 도움(없음 가능) → 끝. 스펙 §2.3.
 * 기록 id는 여기서 만든다(재전송 멱등). 기록 직후 5초 동안 '실행 취소' 토스트를 띄운다.
 */
export function GoalRecordForm({ seasonId, fixture, teams, quarter, initialTeamId = null, onDone }: GoalRecordFormProps) {
  const { user } = useAuth();
  const { data: members = [] } = useMembers();
  const addGoal = useAddGoal();
  const removeGoal = useRemoveGoal();
  const [teamId, setTeamId] = useState<string | null>(initialTeamId);
  const [scorerId, setScorerId] = useState<string | null>(null);

  const sides = [fixture.home_team_id, fixture.away_team_id].map((id) => teams.find((t) => t.id === id)).filter((t): t is LeagueTeam => !!t);
  const team = sides.find((t) => t.id === teamId) ?? null;
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const step = !team ? 'team' : !scorerId ? 'scorer' : 'assist';
  const nameOf = (id: string | null) => (id && id !== NONE ? (members.find((m) => m.id === id)?.name ?? '?') : null);

  const reset = () => {
    setTeamId(null);
    setScorerId(null);
  };

  const handleSave = async (assistId: string | null) => {
    if (!team || !scorerId) return;
    const scorer = scorerId === NONE ? null : scorerId;
    try {
      const goal = await addGoal.mutateAsync({
        seasonId,
        data: {
          id: newId(),
          fixture_id: fixture.id,
          quarter,
          team_id: team.id,
          scorer_id: scorer,
          assist_id: assistId,
          created_by: user?.id ?? null,
        },
      });
      const who = nameOf(scorer) ?? '득점자 미상';
      toast.success(`${quarter}Q ${team.name} 골 · ${who}${assistId ? ` (도움 ${nameOf(assistId)})` : ''}`, {
        duration: 5000,
        action: {
          label: '실행 취소',
          onClick: () => removeGoal.mutate({ id: goal.id, seasonId, fixtureId: fixture.id, actorId: user?.id ?? null }),
        },
      });
      reset();
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '골을 기록하지 못했습니다.');
    }
  };

  const pick = (label: string, active: boolean, onClick: () => void, key: string, disabled = false) => (
    <li key={key}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        className={cn(
          'flex min-h-[48px] w-full items-center justify-center rounded-[12px] border px-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
          active ? 'border-brand bg-brand-soft text-brand-dark' : 'border-border text-ink hover:bg-sunken',
        )}
      >
        {label}
      </button>
    </li>
  );

  return (
    <section aria-label="골 기록" className="flex flex-col gap-4 px-4 pb-4 md:px-0 md:pb-0">
      <div className="flex flex-col gap-2">
        <h4 className="text-[13px] font-semibold text-ink-dim">1. 득점 팀 · {quarter}쿼터</h4>
        <ul className="grid grid-cols-2 gap-2">
          {sides.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  setTeamId(t.id);
                  setScorerId(null);
                }}
                aria-pressed={t.id === teamId}
                className={cn(
                  'flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[14px] border-2 px-3 text-base font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  t.id === teamId ? 'border-brand bg-brand-soft text-brand-dark' : 'border-border text-ink hover:bg-sunken',
                )}
              >
                <span aria-hidden className="h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: t.color }} />
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {step !== 'team' && (
        <div className="flex flex-col gap-2">
          <h4 className="text-[13px] font-semibold text-ink-dim">2. 득점자</h4>
          <ul className="grid grid-cols-3 gap-2 lg:grid-cols-4" aria-label="득점자 고르기">
            {sortedMembers.map((m) => pick(m.name, scorerId === m.id, () => setScorerId(m.id), m.id))}
            {pick('모름', scorerId === NONE, () => setScorerId(NONE), NONE)}
          </ul>
        </div>
      )}

      {step === 'assist' && (
        <div className="flex flex-col gap-2">
          <h4 className="text-[13px] font-semibold text-ink-dim">3. 도움 — 고르면 바로 저장</h4>
          <Button className="h-12" variant="outline" disabled={addGoal.isPending} onClick={() => handleSave(null)}>
            도움 없음으로 저장
          </Button>
          <ul className="grid grid-cols-3 gap-2 lg:grid-cols-4" aria-label="도움 고르기">
            {sortedMembers.map((m) => pick(m.name, false, () => handleSave(m.id), `a-${m.id}`, m.id === scorerId || addGoal.isPending))}
          </ul>
        </div>
      )}
    </section>
  );
}
