import { findTeamConflict, leagueTeamSchema } from '@/features/league-team-edit/model/schema';

const valid = { name: 'A팀', color: '#E5484D', captain_member_id: 'm-1' };

describe('leagueTeamSchema', () => {
  it('이름·색·팀장이 있으면 통과한다', () => {
    expect(leagueTeamSchema.safeParse(valid).success).toBe(true);
  });

  it('팀장은 비워 둘 수 있다', () => {
    expect(leagueTeamSchema.safeParse({ ...valid, captain_member_id: '' }).success).toBe(true);
  });

  it('공백 이름과 잘못된 색은 거부한다', () => {
    expect(leagueTeamSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
    expect(leagueTeamSchema.safeParse({ ...valid, color: 'red' }).success).toBe(false);
  });
});

describe('findTeamConflict', () => {
  const others = [{ name: 'B팀', captain_member_id: 'm-2' }];

  it('겹치지 않으면 null', () => {
    expect(findTeamConflict(valid, others)).toBeNull();
  });

  it('같은 이름(앞뒤 공백 무시)은 거부한다', () => {
    expect(findTeamConflict({ ...valid, name: ' B팀 ' }, others)?.field).toBe('name');
  });

  it('한 사람이 두 팀의 팀장이 될 수 없다', () => {
    expect(findTeamConflict({ ...valid, captain_member_id: 'm-2' }, others)?.field).toBe('captain_member_id');
  });

  it('팀장 미정은 여러 팀이어도 된다', () => {
    expect(findTeamConflict({ ...valid, captain_member_id: '' }, [{ name: 'B팀', captain_member_id: null }])).toBeNull();
  });
});
