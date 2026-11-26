import { buildSeed } from '@/shared/api/adapters/collection/seed';

const NOW = new Date('2026-09-03T10:00:00+09:00'); // 목요일

describe('buildSeed', () => {
  const seed = buildSeed(NOW);

  it('멤버 20명, 전화번호는 010-0000-0000 형식, 스탯은 0~100', () => {
    expect(seed.members).toHaveLength(20);
    for (const member of seed.members) {
      expect(member.phone_number).toMatch(/^010-\d{4}-\d{4}$/);
      for (const value of Object.values(member.stats)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it('데모 사용자 4명과 프로필 역할/연결이 맞는다', () => {
    const byId = Object.fromEntries(seed.profiles.map((p) => [p.id, p]));
    expect(byId['u-member']).toMatchObject({ role: 'member', member_id: 'm-01' });
    expect(byId['u-admin']).toMatchObject({ role: 'admin', member_id: 'm-02' });
    expect(byId['u-superadmin']).toMatchObject({ role: 'superadmin', member_id: 'm-03' });
    expect(byId['u-unlinked']).toMatchObject({ role: 'member', member_id: null });
    expect(seed.users.map((u) => u.id).sort()).toEqual(['u-admin', 'u-member', 'u-superadmin', 'u-unlinked']);
  });

  it('이번 주 경기 투표는 다가오는 토요일, 마감은 그 전 금요일 23:59, 진행 중', () => {
    const thisWeek = seed.voteSessions.find((s) => s.id === 'vs-this-week')!;
    expect(thisWeek.type).toBe('match');
    expect(thisWeek.is_active).toBe(true);
    const eventDate = new Date(thisWeek.event_date);
    const deadline = new Date(thisWeek.deadline);
    expect(eventDate.getDay()).toBe(6);
    expect(eventDate.getTime()).toBeGreaterThan(NOW.getTime());
    expect(deadline.getTime()).toBeLessThan(eventDate.getTime());
    expect(deadline.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('지난 주 경기 투표는 마감·비활성이고 응답이 있다', () => {
    const lastWeek = seed.voteSessions.find((s) => s.id === 'vs-last-week')!;
    expect(lastWeek.is_active).toBe(false);
    expect(new Date(lastWeek.event_date).getTime()).toBeLessThan(NOW.getTime());
    const responses = seed.voteResponses.filter((r) => r.session_id === 'vs-last-week');
    expect(responses.length).toBeGreaterThanOrEqual(12);
  });

  it('응답은 (session_id, member_id)가 유일하고 존재하는 멤버를 가리킨다', () => {
    const memberIds = new Set(seed.members.map((m) => m.id));
    const keys = new Set<string>();
    for (const r of seed.voteResponses) {
      expect(memberIds.has(r.member_id)).toBe(true);
      const key = `${r.session_id}:${r.member_id}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });

  it('경기 5개는 모두 finished이고 양 팀 member_ids가 겹치지 않는다', () => {
    expect(seed.matches).toHaveLength(5);
    for (const match of seed.matches) {
      expect(match.status).toBe('finished');
      const a = new Set(match.team_a.member_ids);
      for (const id of match.team_b.member_ids) expect(a.has(id)).toBe(false);
      expect(match.team_a.players.map((p) => p.member_id)).toEqual(match.team_a.member_ids);
    }
  });

  it('공지 4개 중 1개는 고정, 읽음은 비어 있다', () => {
    expect(seed.announcements).toHaveLength(4);
    expect(seed.announcements.filter((a) => a.is_pinned)).toHaveLength(1);
    expect(seed.announcementReads).toEqual([]);
  });

  it('체크인은 지난 4주 토요일 경기일에만 있고 (날짜, 멤버)가 유일하며 정시우가 4연속 정시다', () => {
    const days = [...new Set(seed.checkins.map((c) => c.date))].sort();
    expect(days).toEqual(['2026-08-08', '2026-08-15', '2026-08-22', '2026-08-29']);
    const keys = new Set(seed.checkins.map((c) => `${c.date}:${c.member_id}`));
    expect(keys.size).toBe(seed.checkins.length);
    const kings = seed.checkins.filter((c) => c.member_id === 'm-05');
    expect(kings.map((c) => c.status)).toEqual(['on_time', 'on_time', 'on_time', 'on_time']);
    for (const c of seed.checkins) {
      if (c.status === 'absent') expect(c.checked_in_at).toBeNull();
      else expect(c.checked_in_at).not.toBeNull();
    }
  });

  it('같은 now로 두 번 만들면 동일하다', () => {
    expect(buildSeed(NOW)).toEqual(seed);
  });
});
