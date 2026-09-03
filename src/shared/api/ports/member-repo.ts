import type { CreateMemberData, Member, UpdateMemberData } from '@/shared/types/member';

export interface MemberRepo {
  /** created_at 내림차순 */
  list(): Promise<Member[]>;
  get(id: string): Promise<Member | null>;
  create(data: CreateMemberData): Promise<Member>;
  update(id: string, data: UpdateMemberData): Promise<Member>;
  remove(id: string): Promise<void>;
  /** 업로드 후 접근 가능한 URL(로컬 어댑터는 data URL)을 돌려준다 */
  uploadPhoto(file: File, memberId: string): Promise<string>;
}
