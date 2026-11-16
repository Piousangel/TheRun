import type { AuditLog, RecordAuditInput } from '@/shared/types/checkin';

export interface AuditRepo {
  /** 변경 한 건을 남긴다. 한 번 남긴 기록은 고치거나 지우는 메서드가 없다(추가 전용). */
  record(input: RecordAuditInput): Promise<AuditLog>;
  /** 특정 대상의 변경 이력. 최신순 */
  listFor(entity: string, entityId: string): Promise<AuditLog[]>;
}
