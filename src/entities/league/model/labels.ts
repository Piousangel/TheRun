import type { MvpMethod, Season, SeasonStatus, Tiebreaker } from '@/shared/types/league';
import type { StatusTone } from '@/shared/ui/status-badge';

export const SEASON_STATUS_LABELS: Record<SeasonStatus, string> = {
  draft: '준비 중',
  active: '진행 중',
  done: '종료',
};

export const SEASON_STATUS_TONES: Record<SeasonStatus, StatusTone> = {
  draft: 'amber',
  active: 'green',
  done: 'gray',
};

export const TIEBREAKER_LABELS: Record<Tiebreaker, string> = {
  goal_diff: '득실차',
  goals_for: '다득점',
  head_to_head: '승자승',
};

export const MVP_METHOD_LABELS: Record<MvpMethod, string> = {
  member_vote: '멤버 투표',
  admin_pick: '운영진 선정',
  champion_vote: '우승팀 투표',
};

/** "3쿼터 × 10분 · 6:6" */
export function formatSeasonFormat(season: Pick<Season, 'quarters_per_match' | 'quarter_minutes' | 'players_per_side'>): string {
  return `${season.quarters_per_match}쿼터 × ${season.quarter_minutes}분 · ${season.players_per_side}:${season.players_per_side}`;
}

/** "승 3 · 무 1 · 패 0" */
export function formatSeasonPoints(season: Pick<Season, 'points'>): string {
  return `승 ${season.points.win} · 무 ${season.points.draw} · 패 ${season.points.loss}`;
}

/** "2026.11.28 – 2026.12.19" */
export function formatSeasonRange(season: Pick<Season, 'starts_on' | 'ends_on'>): string {
  return `${season.starts_on.replaceAll('-', '.')} – ${season.ends_on.replaceAll('-', '.')}`;
}
