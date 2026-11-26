import { addDaysIso, seasonWeekCount } from '@/shared/lib/league-schedule';
import type { Availability, Matchday, Season } from '@/shared/types/league';

export interface SeasonWeek {
  week: number;
  /** YYYY-MM-DD — 일정이 있으면 경기일, 없으면 시작일 + 7일 단위 */
  date: string;
}

/** 참석 가능 주차를 고를 주차 목록. 일정이 있으면 경기일을, 없으면 시즌 기간을 따른다. */
export function seasonWeeks(season: Pick<Season, 'starts_on' | 'ends_on'>, matchdays: Pick<Matchday, 'week' | 'date'>[] = []): SeasonWeek[] {
  if (matchdays.length > 0) return [...matchdays].sort((a, b) => a.week - b.week).map(({ week, date }) => ({ week, date }));
  const count = seasonWeekCount(season.starts_on, season.ends_on);
  return Array.from({ length: count }, (_, i) => ({ week: i + 1, date: addDaysIso(season.starts_on, i * 7) }));
}

/** '12.05' */
export const shortDate = (date: string) => date.slice(5).replace('-', '.');

/** '1·2·4주' / '못 옴' / '미입력' */
export function formatAvailableWeeks(row: Pick<Availability, 'weeks'> | undefined, weekCount: number): string {
  if (!row) return '미입력';
  if (row.weeks.length === 0) return '못 옴';
  if (row.weeks.length === weekCount) return '전부 가능';
  return `${row.weeks.join('·')}주`;
}

export interface AvailabilitySummary {
  /** 주차별 참석 가능 인원 */
  perWeek: { week: number; count: number }[];
  /** 입력한 회원 수(명단 기준) */
  entered: number;
  /** 아직 입력하지 않은 회원 id */
  missing: string[];
}

/** 명단(memberIds) 기준 집계. 명단 밖 회원의 입력은 세지 않는다. */
export function summarizeAvailability(rows: Availability[], memberIds: string[], weeks: number[]): AvailabilitySummary {
  const byMember = new Map(rows.map((r) => [r.member_id, r]));
  const listed = memberIds.map((id) => byMember.get(id)).filter((r): r is Availability => !!r);
  return {
    perWeek: weeks.map((week) => ({ week, count: listed.filter((r) => r.weeks.includes(week)).length })),
    entered: listed.length,
    missing: memberIds.filter((id) => !byMember.has(id)),
  };
}
