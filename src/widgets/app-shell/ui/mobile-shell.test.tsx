import { act, cleanup, render, screen, within } from '@testing-library/react';
import { MobileTabBar } from '@/widgets/app-shell/ui/mobile-tab-bar';
import { MobileTopBar } from '@/widgets/app-shell/ui/mobile-top-bar';
import { usePageHeaderStore } from '@/shared/lib/page-header/store';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const nav = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const adapter = vi.hoisted(() => ({ local: true }));
vi.mock('@/shared/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api/client')>()),
  isLocalAdapter: () => adapter.local,
}));

const auth = vi.hoisted(() => ({ member: { name: '이서준' } as { name: string } | null }));
vi.mock('@/providers/auth-provider', () => ({ useAuth: () => ({ member: auth.member }) }));

afterEach(() => {
  // 이 afterEach는 RTL의 자동 cleanup()보다 먼저 돈다(훅은 역순 실행). 마운트된 헤더가 남은 채로
  // pathname을 '/dashboard'로 되돌리고 오버라이드를 지우면 홈 변형(DEMO 시트 포함)으로 다시 렌더되므로
  // 먼저 명시적으로 언마운트한다.
  cleanup();
  usePageHeaderStore.getState().clearOverride('test');
  __setApiForTests(null);
  nav.pathname = '/dashboard';
  adapter.local = true;
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
  it('홈에서는 멤버 이름을 /me 링크로 보여준다', () => {
    const { wrapper } = setupTestApi();
    render(<MobileTopBar />, { wrapper });
    expect(screen.getByText('이서준님')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '이서준님' })).toHaveAttribute('href', '/me');
  });

  it('로컬 어댑터면 홈 헤더에 DEMO 트리거가 있다', () => {
    const { wrapper } = setupTestApi();
    render(<MobileTopBar />, { wrapper });
    expect(screen.getByRole('button', { name: '데모 메뉴 열기' })).toHaveTextContent('DEMO');
  });

  it('로컬 어댑터가 아니면 DEMO 트리거가 없다', () => {
    adapter.local = false;
    const { wrapper } = setupTestApi();
    render(<MobileTopBar />, { wrapper });
    expect(screen.queryByRole('button', { name: '데모 메뉴 열기' })).toBeNull();
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
