import { addDays, nextSaturday, previousSaturday, set, subDays, subWeeks } from 'date-fns';
import { DEMO_ACCOUNTS, type AuthUser } from '@/shared/api/ports/auth-repo';
import type { Announcement, AnnouncementRead } from '@/shared/types/announcement';
import type { AppProfile } from '@/shared/types/auth';
import type { GoalRecord, Match, PlayerMatchRecord, TeamMatchData } from '@/shared/types/match';
import type { Member, MemberStats } from '@/shared/types/member';
import type { VoteResponse, VoteSession } from '@/shared/types/vote';

export interface SeedData {
  users: AuthUser[];
  profiles: AppProfile[];
  members: Member[];
  voteSessions: VoteSession[];
  voteResponses: VoteResponse[];
  matches: Match[];
  announcements: Announcement[];
  announcementReads: AnnouncementRead[];
}

const MEMBER_NAMES = [
  '김민준', '이서준', '박도윤', '최예준', '정시우', '강하준', '조주원', '윤지호', '장지후', '임준서',
  '한건우', '오현우', '서우진', '신선우', '권서진', '황연우', '안민재', '송현준', '류은우', '홍유준',
];

/** 이름 인덱스로 결정되는 가짜 스탯. 골키퍼형/공격형/수비형이 섞이도록 패턴을 돌린다. */
function statsFor(index: number): MemberStats {
  const base = 45 + ((index * 7) % 30); // 45~74
  const swing = (index % 5) * 6;        // 0~24
  return {
    speed: Math.min(100, base + ((index % 3 === 0) ? swing : 0)),
    shooting: Math.min(100, base + ((index % 3 === 1) ? swing : 0)),
    passing: Math.min(100, base + ((index % 4 === 0) ? swing : 5)),
    dribbling: Math.min(100, base + ((index % 3 === 2) ? swing : 0)),
    stamina: Math.min(100, base + 10 - (index % 4) * 3),
    defense: Math.min(100, base + ((index % 5 === 4) ? swing : 0)),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function iso(date: Date) {
  return date.toISOString();
}

function atTime(date: Date, hours: number, minutes: number) {
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
}

function team(name: string, memberIds: string[], goals: GoalRecord[], goalkeeperId: string): TeamMatchData {
  const players: PlayerMatchRecord[] = memberIds.map((memberId) => ({
    member_id: memberId,
    goals: goals.filter((g) => g.scorer_id === memberId).length,
    assists: goals.filter((g) => g.assist_id === memberId).length,
    saves: memberId === goalkeeperId ? 3 : 0,
    is_mvp: false,
  }));
  return {
    name,
    member_ids: memberIds,
    score: goals.length,
    players,
    goalkeeper_id: goalkeeperId,
    manager_id: null,
    substitutions: [],
    goals_detail: goals,
  };
}

export function buildSeed(now: Date): SeedData {
  const createdAt = iso(subWeeks(now, 12));
  const thisSaturday = atTime(nextSaturday(now), 7, 0);
  const lastSaturday = atTime(previousSaturday(now), 7, 0);

  const members: Member[] = MEMBER_NAMES.map((name, index) => ({
    id: `m-${pad(index + 1)}`,
    name,
    phone_number: `010-${pad(10 + index)}00-${pad(index + 1)}${pad(index + 1)}`,
    profile_photo: null,
    stats: statsFor(index),
    created_at: iso(addDays(subWeeks(now, 12), index)),
    updated_at: iso(addDays(subWeeks(now, 12), index)),
  }));

  const users: AuthUser[] = (Object.keys(DEMO_ACCOUNTS) as Array<keyof typeof DEMO_ACCOUNTS>).map((key) => ({
    id: DEMO_ACCOUNTS[key].id,
    email: DEMO_ACCOUNTS[key].email,
  }));

  const profiles: AppProfile[] = [
    { id: 'u-member', email: DEMO_ACCOUNTS.member.email, role: 'member', member_id: 'm-01', created_at: createdAt, updated_at: createdAt },
    { id: 'u-admin', email: DEMO_ACCOUNTS.admin.email, role: 'admin', member_id: 'm-02', created_at: createdAt, updated_at: createdAt },
    { id: 'u-superadmin', email: DEMO_ACCOUNTS.superadmin.email, role: 'superadmin', member_id: 'm-03', created_at: createdAt, updated_at: createdAt },
    { id: 'u-unlinked', email: DEMO_ACCOUNTS.unlinked.email, role: 'member', member_id: null, created_at: createdAt, updated_at: createdAt },
  ];

  const voteSessions: VoteSession[] = [
    {
      id: 'vs-this-week',
      title: `${thisSaturday.getMonth() + 1}월 ${thisSaturday.getDate()}일 정기 경기`,
      description: '오전 7시 킥오프. 6시 50분까지 도착해주세요.',
      type: 'match',
      event_date: iso(thisSaturday),
      deadline: iso(atTime(subDays(thisSaturday, 1), 23, 59)),
      is_active: true,
      created_at: iso(subDays(thisSaturday, 6)),
      updated_at: iso(subDays(thisSaturday, 6)),
    },
    {
      id: 'vs-dining',
      title: '경기 후 회식',
      description: '경기 끝나고 근처 국밥집. 참석 인원 파악용입니다.',
      type: 'dining',
      event_date: iso(atTime(thisSaturday, 9, 30)),
      deadline: iso(atTime(subDays(thisSaturday, 1), 23, 59)),
      is_active: true,
      created_at: iso(subDays(thisSaturday, 5)),
      updated_at: iso(subDays(thisSaturday, 5)),
    },
    {
      id: 'vs-last-week',
      title: `${lastSaturday.getMonth() + 1}월 ${lastSaturday.getDate()}일 정기 경기`,
      description: null,
      type: 'match',
      event_date: iso(lastSaturday),
      deadline: iso(atTime(subDays(lastSaturday, 1), 23, 59)),
      is_active: false,
      created_at: iso(subDays(lastSaturday, 6)),
      updated_at: iso(subDays(lastSaturday, 1)),
    },
  ];

  const respond = (sessionId: string, memberIndexes: number[], status: 'attending' | 'absent', at: Date): VoteResponse[] =>
    memberIndexes.map((index) => ({
      id: `vr-${sessionId}-${pad(index)}`,
      session_id: sessionId,
      member_id: `m-${pad(index)}`,
      status,
      created_at: iso(at),
      updated_at: iso(at),
    }));

  const voteResponses: VoteResponse[] = [
    ...respond('vs-last-week', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 'attending', subDays(lastSaturday, 3)),
    ...respond('vs-last-week', [15, 16, 17], 'absent', subDays(lastSaturday, 3)),
    ...respond('vs-this-week', [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 'attending', subDays(thisSaturday, 4)),
    ...respond('vs-this-week', [12, 13], 'absent', subDays(thisSaturday, 4)),
    ...respond('vs-dining', [2, 3, 4, 5, 6], 'attending', subDays(thisSaturday, 4)),
  ];

  const teamA = ['m-01', 'm-03', 'm-05', 'm-07', 'm-09', 'm-11', 'm-13'];
  const teamB = ['m-02', 'm-04', 'm-06', 'm-08', 'm-10', 'm-12', 'm-14'];
  const matches: Match[] = [0, 1, 2, 3, 4].map((weekOffset) => {
    const date = atTime(subWeeks(lastSaturday, weekOffset), 7, 0);
    const goalsA: GoalRecord[] = [
      { minute: 12 + weekOffset, scorer_id: 'm-05', assist_id: 'm-03', timestamp: iso(date) },
      { minute: 33, scorer_id: 'm-07', assist_id: null, timestamp: iso(date) },
    ];
    const goalsB: GoalRecord[] = weekOffset % 2 === 0
      ? [{ minute: 20, scorer_id: 'm-04', assist_id: 'm-06', timestamp: iso(date) }]
      : [
          { minute: 8, scorer_id: 'm-04', assist_id: null, timestamp: iso(date) },
          { minute: 25, scorer_id: 'm-08', assist_id: 'm-10', timestamp: iso(date) },
          { minute: 41, scorer_id: 'm-04', assist_id: 'm-06', timestamp: iso(date) },
        ];
    const a = team('Team A', teamA, goalsA, 'm-13');
    const b = team('Team B', teamB, goalsB, 'm-14');
    a.players[2].is_mvp = weekOffset % 2 === 0; // m-05
    b.players[1].is_mvp = weekOffset % 2 === 1; // m-04
    return {
      id: `mt-${weekOffset + 1}`,
      date: iso(date),
      location: '더런 풋살장',
      team_a: a,
      team_b: b,
      notes: weekOffset === 0 ? '전반 비가 와서 10분 늦게 시작' : null,
      vote_session_id: weekOffset === 0 ? 'vs-last-week' : null,
      match_number: 1,
      status: 'finished',
      start_time: iso(date),
      end_time: iso(atTime(date, 8, 0)),
      duration: 50 * 60,
      created_at: iso(date),
      updated_at: iso(atTime(date, 8, 0)),
    };
  });

  const announcements: Announcement[] = [
    { id: 'an-1', title: '9월 회비 안내', body: '이번 달 회비는 9월 10일까지 입금 부탁드립니다.', category: 'general', is_pinned: true, publish_at: iso(subDays(now, 2)), created_by: 'u-admin', created_at: iso(subDays(now, 2)), updated_at: iso(subDays(now, 2)) },
    { id: 'an-2', title: '이번 주 경기장 변경', body: '이번 주는 A구장 대신 B구장에서 진행합니다.', category: 'match', is_pinned: false, publish_at: iso(subDays(now, 1)), created_by: 'u-admin', created_at: iso(subDays(now, 1)), updated_at: iso(subDays(now, 1)) },
    { id: 'an-3', title: '10월 첫째 주 휴식', body: '추석 연휴로 10월 첫째 주 경기는 쉽니다.', category: 'schedule', is_pinned: false, publish_at: iso(subDays(now, 5)), created_by: 'u-superadmin', created_at: iso(subDays(now, 5)), updated_at: iso(subDays(now, 5)) },
    { id: 'an-4', title: '분실물: 검정 정강이 보호대', body: '지난 경기 후 벤치에 남겨진 보호대를 보관 중입니다.', category: 'urgent', is_pinned: false, publish_at: iso(subDays(now, 6)), created_by: 'u-admin', created_at: iso(subDays(now, 6)), updated_at: iso(subDays(now, 6)) },
  ];

  return { users, profiles, members, voteSessions, voteResponses, matches, announcements, announcementReads: [] };
}
