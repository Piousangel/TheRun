import type { Collection } from '@/shared/api/adapters/collection/collection';
import type { SessionStore } from '@/shared/api/adapters/collection/storage';
import { DEMO_ACCOUNTS, INVITE_CODE_INVALID_MESSAGE, type AuthRepo, type AuthUser } from '@/shared/api/ports/auth-repo';
import { newId } from '@/shared/lib/id';
import { generateInviteCode, hashInviteCode } from '@/shared/lib/invite-code';
import { normalizePhoneNumber } from '@/shared/lib/utils';
import type { AppProfile } from '@/shared/types/auth';
import type { Member } from '@/shared/types/member';

/** DB `invite_codes` 테이블과 같은 모양. 코드 원문은 저장하지 않고 해시만 둔다. */
export interface InviteCodeRow {
  id: string;
  code_hash: string;
  member_id: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  revoked_at: string | null;
  created_by: string;
  created_at: string;
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface Deps {
  inviteCodes: Collection<InviteCodeRow>;
  users: Collection<AuthUser>;
  profiles: Collection<AppProfile>;
  members: Collection<Member>;
  session: SessionStore;
  now: () => Date;
}

const ROLE_ORDER: Record<AppProfile['role'], number> = { superadmin: 2, admin: 1, member: 0 };
const PHONE_PATTERN = /^(010|000)-\d{4}-\d{4}$/;

export function createCollectionAuthRepo({ users, profiles, members, inviteCodes, session, now }: Deps): AuthRepo {
  const listeners = new Set<(user: AuthUser | null) => void>();

  const currentUser = async (): Promise<AuthUser | null> => {
    const id = session.get();
    return id ? users.get(id) : null;
  };

  const requireUser = async (): Promise<AuthUser> => {
    const user = await currentUser();
    if (!user) throw new Error('로그인이 필요합니다.');
    return user;
  };

  const ensureProfile = async (user: AuthUser): Promise<AppProfile> => {
    const existing = await profiles.get(user.id);
    if (existing) return existing;
    const at = now().toISOString();
    return profiles.insert({ id: user.id, email: user.email, role: 'member', member_id: null, created_at: at, updated_at: at });
  };

  const emit = (user: AuthUser | null) => listeners.forEach((listener) => listener(user));

  return {
    getUser: currentUser,
    onAuthStateChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async signInWithOAuth() {
      return { url: null };
    },
    async signInAsDemo(account) {
      const { id } = DEMO_ACCOUNTS[account];
      const user = await users.get(id);
      if (!user) throw new Error(`데모 계정 ${id}이(가) 시드에 없습니다.`);
      session.set(user.id);
      await ensureProfile(user);
      emit(user);
      return user;
    },
    async signOut() {
      session.clear();
      emit(null);
    },
    ensureProfile,
    async listProfiles() {
      return (await profiles.all()).sort((a, b) => {
        if (ROLE_ORDER[a.role] !== ROLE_ORDER[b.role]) return ROLE_ORDER[b.role] - ROLE_ORDER[a.role];
        return (a.email ?? '').localeCompare(b.email ?? '');
      });
    },
    async setProfileRole(targetProfileId, role) {
      const me = await ensureProfile(await requireUser());
      if (me.role !== 'superadmin') throw new Error('슈퍼관리자만 역할을 변경할 수 있습니다.');
      if (targetProfileId === me.id) throw new Error('자기 자신의 역할은 이 화면에서 변경할 수 없습니다.');
      const target = await profiles.get(targetProfileId);
      if (!target) throw new Error('대상 프로필을 찾을 수 없습니다.');
      if (target.role === 'superadmin') throw new Error('슈퍼관리자 계정은 이 화면에서 변경할 수 없습니다.');
      return profiles.update(targetProfileId, { role, updated_at: now().toISOString() });
    },
    async linkMyMember(memberId) {
      const me = await ensureProfile(await requireUser());
      if (me.member_id && me.member_id !== memberId) throw new Error('이미 다른 멤버와 연결되어 있습니다. 먼저 연결을 해제해주세요.');
      if (!(await members.get(memberId))) throw new Error('연결할 멤버를 찾을 수 없습니다.');
      const takenBy = (await profiles.all()).find((p) => p.member_id === memberId && p.id !== me.id);
      if (takenBy) throw new Error('이미 다른 계정에 연결된 멤버입니다.');
      return profiles.update(me.id, { member_id: memberId, updated_at: now().toISOString() });
    },
    async unlinkMyMember() {
      const me = await ensureProfile(await requireUser());
      return profiles.update(me.id, { member_id: null, updated_at: now().toISOString() });
    },
    async listClaimableMembers() {
      const me = await ensureProfile(await requireUser());
      const linkedElsewhere = new Set((await profiles.all()).filter((p) => p.member_id && p.id !== me.id).map((p) => p.member_id));
      return (await members.all())
        .filter((m) => !linkedElsewhere.has(m.id))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    },
    async issueInviteCode(memberId) {
      const me = await ensureProfile(await requireUser());
      if (me.role === 'member') throw new Error('운영진만 초대 코드를 발급할 수 있습니다.');
      if (!(await members.get(memberId))) throw new Error('멤버를 찾을 수 없습니다.');
      if ((await profiles.all()).some((p) => p.member_id === memberId)) throw new Error('이미 계정이 연결된 멤버입니다.');
      const at = now();
      for (const row of await inviteCodes.all()) {
        if (row.member_id === memberId && !row.used_at && !row.revoked_at) {
          await inviteCodes.update(row.id, { revoked_at: at.toISOString() });
        }
      }
      const code = generateInviteCode();
      const expiresAt = new Date(at.getTime() + INVITE_TTL_MS).toISOString();
      await inviteCodes.insert({
        id: newId(),
        code_hash: await hashInviteCode(code),
        member_id: memberId,
        expires_at: expiresAt,
        used_at: null,
        used_by: null,
        revoked_at: null,
        created_by: me.id,
        created_at: at.toISOString(),
      });
      return { code, expiresAt };
    },
    async redeemInviteCode(code) {
      const me = await ensureProfile(await requireUser());
      const hash = await hashInviteCode(code);
      const at = now();
      const row = (await inviteCodes.all()).find(
        (r) => r.code_hash === hash && !r.used_at && !r.revoked_at && new Date(r.expires_at) > at,
      );
      if (!row) throw new Error(INVITE_CODE_INVALID_MESSAGE);
      // DB 함수와 같이 코드를 먼저 선점(소진)한 뒤 연결 가능 여부를 검사한다.
      await inviteCodes.update(row.id, { used_at: at.toISOString(), used_by: me.id });
      if (me.member_id) throw new Error(INVITE_CODE_INVALID_MESSAGE);
      if ((await profiles.all()).some((p) => p.member_id === row.member_id)) throw new Error(INVITE_CODE_INVALID_MESSAGE);
      return profiles.update(me.id, { member_id: row.member_id, updated_at: at.toISOString() });
    },
    async updateMyMemberProfile({ name, phoneNumber }) {
      const me = await ensureProfile(await requireUser());
      const trimmedName = name.trim();
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      if (!trimmedName) throw new Error('이름을 입력해주세요.');
      if (!PHONE_PATTERN.test(normalizedPhone)) throw new Error('전화번호는 010-1234-5678 또는 000-0000-0000 형식이어야 합니다.');
      if (!me.member_id) throw new Error('먼저 내 멤버를 연결해주세요.');
      return members.update(me.member_id, { name: trimmedName, phone_number: normalizedPhone, updated_at: now().toISOString() });
    },
  };
}
