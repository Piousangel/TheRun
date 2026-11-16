/** 출석 체크인 + 감사 로그 (스펙 2026-11-15-owner-brief §3, §2.2 AuditLog). 투표 = 올 예정, 체크인 = 실제로 옴. */

/** on_time: 06:30까지, late: 그 뒤, absent: 운영진이 결석으로 확정 */
export type CheckinStatus = 'on_time' | 'late' | 'absent';

export interface Checkin {
  id: string;
  /** 경기일 YYYY-MM-DD (KST). 리그 경기일과 평소 주간 경기 모두 날짜로 묶는다. */
  date: string;
  member_id: string;
  status: CheckinStatus;
  /** 본인 체크인 시각. 운영진이 대신 확정한 행은 null */
  checked_in_at: string | null;
  /** 운영진이 확정·수정했다면 그 사용자 id */
  confirmed_by: string | null;
  updated_at: string;
}

export interface CheckInInput {
  date: string;
  member_id: string;
}

export interface ConfirmCheckinInput {
  date: string;
  member_id: string;
  status: CheckinStatus;
  actor_id: string;
}

export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLog {
  id: string;
  entity: string;
  entity_id: string;
  action: AuditAction;
  before: unknown | null;
  after: unknown | null;
  actor_id: string;
  at: string;
}

export interface RecordAuditInput {
  entity: string;
  entity_id: string;
  action: AuditAction;
  before?: unknown | null;
  after?: unknown | null;
  actor_id: string;
}
