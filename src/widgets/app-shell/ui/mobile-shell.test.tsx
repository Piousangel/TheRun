import { act, render, screen, within } from '@testing-library/react';
import { MobileTabBar } from '@/widgets/app-shell/ui/mobile-tab-bar';
import { MobileTopBar } from '@/widgets/app-shell/ui/mobile-top-bar';
import { usePageHeaderStore } from '@/shared/lib/page-header/store';

const nav = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

const auth = vi.hoisted(() => ({ member: { name: '이서준' } as { name: string } | null }));
vi.mock('@/providers/auth-provider', () => ({ useAuth: () => ({ member: auth.member }) }));

afterEach(() => {
  nav.pathname = '/dashboard';
  // clearOverride()는 직전 테스트에서 렌더된 컴포넌트가 RTL의 자동 cleanup()보다
  // 먼저 이 afterEach에서 실행되어 아직 마운트/구독된 상태일 수 있다. act()로 감싸
  // 그 상태 갱신을 테스트 밖 경고 없이 처리한다.
  act(() => {
    usePageHeaderStore.getState().clearOverride('test');
  });
});

describe('MobileTabBar', () => {
  it('탭 5개를 순서대로 렌더한다', () => {
    render(<MobileTabBar />);
    const links = within(screen.getByRole('navigation', { name: '주요 메뉴' })).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['홈', '투표', '경기', '출석', '더보기']);
  });

  it('현재 탭에 aria-current="page"를 단다', () => {
    nav.pathname = '/matches/m-1';
    render(<MobileTabBar />);
    expect(screen.getByRole('link', { name: '경기' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '홈' })).not.toHaveAttribute('aria-current');
  });

  it('더보기 하위 화면에서는 더보기 탭이 활성', () => {
    nav.pathname = '/announcements';
    render(<MobileTabBar />);
    expect(screen.getByRole('link', { name: '더보기' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('MobileTopBar', () => {
  it('홈에서는 멤버 이름을 보여준다', () => {
    render(<MobileTopBar />);
    expect(screen.getByText('이서준님')).toBeInTheDocument();
  });

  it('탭 루트에서는 렌더하지 않는다', () => {
    nav.pathname = '/votes';
    const { container } = render(<MobileTopBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('상세 화면에서는 뒤로가기와 라우트 제목', () => {
    nav.pathname = '/votes/v-1';
    render(<MobileTopBar />);
    expect(screen.getByRole('link', { name: '뒤로' })).toHaveAttribute('href', '/votes');
    expect(screen.getByText('투표')).toBeInTheDocument();
  });

  it('페이지 오버라이드가 제목과 뒤로가기 대상을 덮는다', () => {
    nav.pathname = '/votes/v-1';
    act(() => {
      usePageHeaderStore.getState().setOverride('test', { title: '9월 19일 정기 경기', subtitle: '마감 D-2', backHref: '/votes?tab=closed' });
    });
    render(<MobileTopBar />);
    expect(screen.getByText('9월 19일 정기 경기')).toBeInTheDocument();
    expect(screen.getByText('마감 D-2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '뒤로' })).toHaveAttribute('href', '/votes?tab=closed');
  });
});
