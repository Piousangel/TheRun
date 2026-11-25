'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useSetLineup } from '@/entities/league/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/shared/lib/utils';
import type { Appearance, Fixture, LeagueTeam } from '@/shared/types/league';
import { Button } from '@/shared/ui/button';

interface LineupFormProps {
  seasonId: string;
  fixture: Fixture;
  team: LeagueTeam;
  quarter: number;
  /** 시즌 전체 출전 기록. 이 경기 명단만 골라 쓴다. */
  appearances: Appearance[];
  /** 그 쿼터 정원(시즌 `players_per_side`). 넘어도 저장은 된다(교체로 들어온 선수). */
  playersPerSide: number;
  /** 저장·취소 뒤 부른다(모바일 시트 / 데스크톱 패널 닫기) */
  onDone: () => void;
}

/**
 * 쿼터 출전 명단(스펙 §2.3). 이 쿼터 명단이 비어 있으면 **직전 쿼터 명단을 기본값**으로 채우고 탭으로 바꾼다.
 * 같은 쿼터에 상대 팀 명단에 있는 선수는 고를 수 없다.
 */
export function LineupForm({ seasonId, fixture, team, quarter, appearances, playersPerSide, onDone }: LineupFormProps) {
  const { user } = useAuth();
  const { data: members = [] } = useMembers();
  const setLineup = useSetLineup();

  const inFixture = appearances.filter((a) => a.fixture_id === fixture.id);
  const idsOf = (q: number, teamId: string) => inFixture.filter((a) => a.quarter === q && a.team_id === teamId).map((a) => a.member_id);
  const current = idsOf(quarter, team.id);
  const previous = quarter > 1 ? idsOf(quarter - 1, team.id) : [];
  const fromPrevious = current.length === 0 && previous.length > 0;
  const taken = new Set(inFixture.filter((a) => a.quarter === quarter && a.team_id !== team.id).map((a) => a.member_id));

  const [picked, setPicked] = useState<string[]>(() => (fromPrevious ? previous.filter((id) => !taken.has(id)) : current));
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const toggle = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSave = async () => {
    try {
      await setLineup.mutateAsync({
        seasonId,
        data: { fixture_id: fixture.id, quarter, team_id: team.id, member_ids: picked, actor_id: user?.id ?? null },
      });
      toast.success(`${quarter}Q ${team.name} 출전 명단 ${picked.length}명을 저장했어요.`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '명단을 저장하지 못했습니다.');
    }
  };

  return (
    <form
      aria-label={`${team.name} ${quarter}쿼터 출전 명단`}
      className="flex flex-col gap-3 px-4 pb-4 md:px-0 md:pb-0"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave();
      }}
    >
      <p className="text-[13px] text-ink-dim" role="status">
        {fromPrevious ? `${quarter - 1}쿼터 명단을 불러왔어요. 바뀐 선수만 탭하세요.` : '뛴 선수를 탭하세요. 교체로 들어온 선수도 넣어요.'}
        <span className={cn('ml-1 font-semibold tabular-nums', picked.length === playersPerSide ? 'text-brand-dark' : 'text-ink')}>
          {picked.length}/{playersPerSide}명
        </span>
      </p>
      <ul className="grid grid-cols-3 gap-2 lg:grid-cols-4" aria-label="출전 선수 고르기">
        {sortedMembers.map((m) => {
          const active = picked.includes(m.id);
          const disabled = taken.has(m.id);
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => toggle(m.id)}
                disabled={disabled}
                aria-pressed={active}
                title={disabled ? '상대 팀 명단에 있어요' : undefined}
                className={cn(
                  'flex min-h-[48px] w-full items-center justify-center rounded-[12px] border px-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
                  active ? 'border-brand bg-brand-soft text-brand-dark' : 'border-border text-ink hover:bg-sunken',
                )}
              >
                {m.name}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="h-12" onClick={onDone}>
          취소
        </Button>
        <Button type="submit" className="h-12" disabled={setLineup.isPending}>
          명단 저장 ({picked.length}명)
        </Button>
      </div>
    </form>
  );
}
