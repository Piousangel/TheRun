import {
  MORE_GROUPS,
  NAV_GROUPS,
  TAB_ITEMS,
  activeTabHref,
  isNavItemActive,
  isShellHidden,
  resolveRouteMeta,
  visibleGroups,
} from '@/shared/config/navigation';

describe('TAB_ITEMS', () => {
  it('역할 무관 5개: 홈·투표·경기·출석·더보기', () => {
    expect(TAB_ITEMS.map((item) => [item.label, item.href])).toEqual([
      ['홈', '/dashboard'],
      ['투표', '/votes'],
      ['경기', '/matches'],
      ['출석', '/attendance'],
      ['더보기', '/more'],
    ]);
  });
});

describe('visibleGroups', () => {
  it('멤버에게는 운영 그룹이 없다', () => {
    expect(visibleGroups(NAV_GROUPS, false).map((g) => g.label)).toEqual([null, '클럽', '계정']);
  });

  it('관리자에게는 운영 그룹(멤버, 전략·팀 편성)이 보인다', () => {
    const ops = visibleGroups(NAV_GROUPS, true).find((g) => g.label === '운영');
    expect(ops?.items.map((i) => i.href)).toEqual(['/members', '/strategy']);
  });

  it('더보기 그룹은 주요 그룹을 제외한다', () => {
    expect(MORE_GROUPS.map((g) => g.label)).toEqual(['클럽', '운영', '계정']);
  });
});

describe('isNavItemActive', () => {
  it('정확히 같거나 하위 경로면 활성', () => {
    expect(isNavItemActive('/votes', '/votes')).toBe(true);
    expect(isNavItemActive('/votes/abc', '/votes')).toBe(true);
  });

  it('접두어만 같은 다른 경로는 비활성', () => {
    expect(isNavItemActive('/votes-archive', '/votes')).toBe(false);
  });
});

describe('activeTabHref', () => {
  it('탭 경로와 그 하위는 해당 탭', () => {
    expect(activeTabHref('/dashboard')).toBe('/dashboard');
    expect(activeTabHref('/matches/m-1')).toBe('/matches');
  });

  it('더보기 안의 화면은 더보기 탭', () => {
    for (const path of ['/more', '/announcements', '/club-guide', '/members', '/members/m-1', '/strategy', '/me']) {
      expect(activeTabHref(path)).toBe('/more');
    }
  });

  it('모르는 경로는 null', () => {
    expect(activeTabHref('/unknown')).toBeNull();
  });
});

describe('isShellHidden', () => {
  it('인증 화면에서는 셸을 숨긴다', () => {
    for (const path of ['/login', '/signup', '/reset', '/auth/callback']) {
      expect(isShellHidden(path)).toBe(true);
    }
  });

  it('앱 화면에서는 셸을 보인다', () => {
    expect(isShellHidden('/dashboard')).toBe(false);
    expect(isShellHidden('/more')).toBe(false);
  });
});

describe('resolveRouteMeta', () => {
  it('홈', () => {
    expect(resolveRouteMeta('/dashboard')).toEqual({ title: '홈', kind: 'home', backHref: null });
  });

  it('탭 루트는 헤더 없는 root', () => {
    expect(resolveRouteMeta('/votes')).toEqual({ title: '투표', kind: 'root', backHref: null });
    expect(resolveRouteMeta('/more')).toEqual({ title: '더보기', kind: 'root', backHref: null });
  });

  it('더보기 하위 화면은 /more로 돌아간다', () => {
    expect(resolveRouteMeta('/announcements')).toEqual({ title: '공지', kind: 'more-child', backHref: '/more' });
    expect(resolveRouteMeta('/strategy')).toEqual({ title: '전략·팀 편성', kind: 'more-child', backHref: '/more' });
  });

  it('상세 화면은 목록으로 돌아간다', () => {
    expect(resolveRouteMeta('/votes/v-1')).toEqual({ title: '투표', kind: 'deep', backHref: '/votes' });
    expect(resolveRouteMeta('/matches/m-1')).toEqual({ title: '경기', kind: 'deep', backHref: '/matches' });
    expect(resolveRouteMeta('/members/m-1')).toEqual({ title: '멤버', kind: 'deep', backHref: '/members' });
  });

  it('모르는 경로는 제목 없는 root', () => {
    expect(resolveRouteMeta('/unknown')).toEqual({ title: '', kind: 'root', backHref: null });
  });
});
