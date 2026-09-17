import type { AppRole } from '@/shared/types/auth';

export const ROLE_LABELS: Record<AppRole, string> = {
  member: '멤버',
  admin: '관리자',
  superadmin: '슈퍼관리자',
};
