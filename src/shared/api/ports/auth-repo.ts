import type { AppProfile } from '@/shared/types/auth';
import type { Member } from '@/shared/types/member';

export interface AuthUser {
  id: string;
  email: string | null;
}

export type OAuthProvider = 'google' | 'kakao';

export type DemoAccountKey = 'member' | 'admin' | 'superadmin' | 'unlinked';

export const DEMO_ACCOUNTS: Record<DemoAccountKey, { id: string; email: string; label: string }> = {
  member: { id: 'u-member', email: 'member@therun.demo', label: '멤버' },
  admin: { id: 'u-admin', email: 'admin@therun.demo', label: '관리자' },
  superadmin: { id: 'u-superadmin', email: 'superadmin@therun.demo', label: '슈퍼관리자' },
  unlinked: { id: 'u-unlinked', email: 'newbie@therun.demo', label: '미연결 계정' },
};

export interface AuthRepo {
  getUser(): Promise<AuthUser | null>;
  /** 반환값은 unsubscribe */
  onAuthStateChange(listener: (user: AuthUser | null) => void): () => void;
  /** OAuth 리다이렉트 URL을 돌려준다. 로컬 어댑터는 url: null */
  signInWithOAuth(provider: OAuthProvider, redirectTo: string): Promise<{ url: string | null }>;
  /** 로컬 어댑터 전용. supabase 어댑터는 Error를 던진다 */
  signInAsDemo(account: DemoAccountKey): Promise<AuthUser>;
  signOut(): Promise<void>;
  /** 프로필이 없으면 role='member', member_id=null로 만든다 */
  ensureProfile(user: AuthUser): Promise<AppProfile>;
  /** role 내림차순, email 오름차순 */
  listProfiles(): Promise<AppProfile[]>;
  /** superadmin만. 자기 자신·superadmin 대상 불가 */
  setProfileRole(targetProfileId: string, role: 'member' | 'admin'): Promise<AppProfile>;
  /** 이미 다른 멤버와 연결돼 있거나, 대상이 다른 계정에 연결돼 있으면 Error */
  linkMyMember(memberId: string): Promise<AppProfile>;
  unlinkMyMember(): Promise<AppProfile>;
  /** 아무 계정에도 연결되지 않았거나 나에게 연결된 멤버. name 오름차순 */
  listClaimableMembers(): Promise<Member[]>;
  /** 내 연결 멤버의 이름/전화번호 수정. 전화번호는 (010|000)-0000-0000 형식 */
  updateMyMemberProfile(input: { name: string; phoneNumber: string }): Promise<Member>;
}
