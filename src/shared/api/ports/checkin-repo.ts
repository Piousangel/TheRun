import type { CheckInInput, Checkin, ConfirmCheckinInput } from '@/shared/types/checkin';

export interface CheckinRepo {
  /** 한 경기일의 체크인 전체. 본인 체크인 시각 오름차순(운영진 확정 행은 뒤) */
  listByDate(date: string): Promise<Checkin[]>;
  /** 한 멤버의 체크인 이력. 날짜 내림차순 (출석왕·스트릭 계산용) */
  listByMember(memberId: string): Promise<Checkin[]>;
  /**
   * 본인 체크인. 시각으로 정시/지각을 판정한다. 같은 날 이미 있으면 기존 행을 그대로 돌려준다(멱등).
   * 05:30~08:00 창 밖이면 거부한다.
   */
  checkIn(input: CheckInInput): Promise<Checkin>;
  /** 운영진 확정·수정. 행이 없으면 만들고, 있으면 status를 고친다. 감사 로그에 남는다. */
  confirm(input: ConfirmCheckinInput): Promise<Checkin>;
}
