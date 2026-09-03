import type { AuthRepo } from '@/shared/api/ports/auth-repo';

export interface AuthRepoFixture {
  repo: AuthRepo;
  /** 다른 계정에 이미 연결된 멤버 id (시드에서 m-02 = u-admin) */
  takenMemberId: string;
  /** 아무 계정에도 연결되지 않은 멤버 id */
  freeMemberId: string;
}

/** 로컬 어댑터는 signInAsDemo로 계정을 바꾼다. (supabase 어댑터에서 이 계약을 돌릴 땐 fixture가 대신 로그인해야 한다) */
export function runAuthRepoContract(makeRepo: () => Promise<AuthRepoFixture>) {
  describe('AuthRepo contract', () => {
    it('로그아웃 상태에서 getUser는 null, 변경은 로그인 필요', async () => {
      const { repo } = await makeRepo();
      await repo.signOut();
      expect(await repo.getUser()).toBeNull();
      await expect(repo.unlinkMyMember()).rejects.toThrow('로그인이 필요합니다.');
    });

    it('signInAsDemo → ensureProfile → onAuthStateChange 알림', async () => {
      const { repo } = await makeRepo();
      const seen: Array<string | null> = [];
      const unsubscribe = repo.onAuthStateChange((u) => seen.push(u?.id ?? null));
      const user = await repo.signInAsDemo('unlinked');
      expect(user.id).toBe('u-unlinked');
      const profile = await repo.ensureProfile(user);
      expect(profile).toMatchObject({ id: 'u-unlinked', role: 'member', member_id: null });
      await repo.signOut();
      unsubscribe();
      expect(seen).toEqual(['u-unlinked', null]);
    });

    it('link/unlink 규칙', async () => {
      const { repo, takenMemberId, freeMemberId } = await makeRepo();
      await repo.signInAsDemo('unlinked');
      await expect(repo.linkMyMember(takenMemberId)).rejects.toThrow('이미 다른 계정에 연결된 멤버입니다.');
      await expect(repo.linkMyMember('nope')).rejects.toThrow('연결할 멤버를 찾을 수 없습니다.');
      const linked = await repo.linkMyMember(freeMemberId);
      expect(linked.member_id).toBe(freeMemberId);
      await expect(repo.linkMyMember(takenMemberId)).rejects.toThrow('이미 다른 멤버와 연결되어 있습니다.');
      const claimable = await repo.listClaimableMembers();
      expect(claimable.some((m) => m.id === freeMemberId)).toBe(true);
      expect(claimable.some((m) => m.id === takenMemberId)).toBe(false);
      const unlinked = await repo.unlinkMyMember();
      expect(unlinked.member_id).toBeNull();
    });

    it('updateMyMemberProfile 규칙', async () => {
      const { repo, freeMemberId } = await makeRepo();
      await repo.signInAsDemo('unlinked');
      await expect(repo.updateMyMemberProfile({ name: '홍길동', phoneNumber: '010-1234-5678' })).rejects.toThrow('먼저 내 멤버를 연결해주세요.');
      await repo.linkMyMember(freeMemberId);
      await expect(repo.updateMyMemberProfile({ name: '  ', phoneNumber: '010-1234-5678' })).rejects.toThrow('이름을 입력해주세요.');
      await expect(repo.updateMyMemberProfile({ name: '홍길동', phoneNumber: '12' })).rejects.toThrow('형식이어야 합니다.');
      const member = await repo.updateMyMemberProfile({ name: ' 홍길동 ', phoneNumber: '01012345678' });
      expect(member).toMatchObject({ id: freeMemberId, name: '홍길동', phone_number: '010-1234-5678' });
    });

    it('setProfileRole 규칙', async () => {
      const { repo } = await makeRepo();
      await repo.signInAsDemo('admin');
      await expect(repo.setProfileRole('u-member', 'admin')).rejects.toThrow('슈퍼관리자만');
      await repo.signInAsDemo('superadmin');
      await expect(repo.setProfileRole('u-superadmin', 'member')).rejects.toThrow('자기 자신');
      await expect(repo.setProfileRole('nope', 'admin')).rejects.toThrow('대상 프로필을 찾을 수 없습니다.');
      const promoted = await repo.setProfileRole('u-member', 'admin');
      expect(promoted.role).toBe('admin');
      const profiles = await repo.listProfiles();
      expect(profiles[0].role).toBe('superadmin');
    });
  });
}
