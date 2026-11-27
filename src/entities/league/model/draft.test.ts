import { buildDraftView, totalStats } from '@/entities/league/model/draft';
import type { Draft } from '@/shared/types/league';

const teams = [
  { id: 'A', captain_member_id: 'ca' },
  { id: 'B', captain_member_id: null },
  { id: 'C', captain_member_id: 'cc' },
];

const draft = (picks: [string, string][], status: Draft['status'] = 'open'): Draft => ({
  id: 's', season_id: 's', order: ['C', 'A', 'B'], status, created_at: '', updated_at: '',
  picks: picks.map(([team_id, member_id], i) => ({ pick_no: i + 1, team_id, member_id, picked_by: null, at: '' })),
});

describe('buildDraftView', () => {
  it('시작 전: 팀장만 명단에 있고 차례는 없다', () => {
    const view = buildDraftView(null, teams);
    expect(view.rosters).toEqual({ A: ['ca'], B: [], C: ['cc'] });
    expect(view.onClockTeamId).toBeNull();
    expect([...view.taken].sort()).toEqual(['ca', 'cc']);
  });

  it('진행 중: 스네이크 차례·다음 차례·팀별 명단', () => {
    const view = buildDraftView(draft([['C', 'm1'], ['A', 'm2'], ['B', 'm3']]), teams);
    expect(view).toMatchObject({ nextPickNo: 4, round: 2, onClockTeamId: 'B', upcoming: ['A', 'C', 'C'] });
    expect(view.rosters).toEqual({ A: ['ca', 'm2'], B: ['m3'], C: ['cc', 'm1'] });
    expect(view.taken.has('m3')).toBe(true);
  });

  it('끝난 드래프트는 차례가 없다', () => {
    expect(buildDraftView(draft([['C', 'm1']], 'done'), teams).onClockTeamId).toBeNull();
  });

  it('스탯 합', () => {
    expect(totalStats({ speed: 10, shooting: 20, passing: 30, dribbling: 40, stamina: 50, defense: 60 })).toBe(210);
  });
});
