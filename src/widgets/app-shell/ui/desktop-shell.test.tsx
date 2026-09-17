import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesktopSidebar } from '@/widgets/app-shell/ui/desktop-sidebar';
import { DesktopTopBar } from '@/widgets/app-shell/ui/desktop-top-bar';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const nav = vi.hoisted(() => ({ pathname: '/dashboard', push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, refresh: nav.refresh }),
}));

const auth = vi.hoisted(() => ({
  isAdmin: false,
  member: { name: '이서준' } as { name: string } | null,
  profile: { role: 'member' } as { role: 'member' | 'admin' | 'superadmin' } | null,
}));
vi.mock('@/providers/auth-provider', () => ({ useAuth: () => auth }));

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

afterEach(() => {
  __setApiForTests(null);
  nav.pathname = '/dashboard';
  nav.push.mockClear();
  auth.isAdmin = false;
  auth.profile = { role: 'member' };
  toastError.mockClear();
});

describe('DesktopSidebar', () => {
  it('멤버에게는 운영 메뉴가 없다', () => {
    const { wrapper } = setupTestApi();
    render(<DesktopSidebar />, { wrapper });
    const sidebar = screen.getByRole('navigation', { name: '사이드 메뉴' });
    expect(within(sidebar).queryByRole('link', { name: '멤버' })).toBeNull();
    expect(within(sidebar).getByRole('link', { name: '출석' })).toBeInTheDocument();
  });

  it('관리자에게는 운영 메뉴가 보이고 현재 화면이 활성', () => {
    auth.isAdmin = true;
    auth.profile = { role: 'admin' };
    nav.pathname = '/members/m-1';
    const { wrapper } = setupTestApi();
    render(<DesktopSidebar />, { wrapper });
    expect(screen.getByRole('link', { name: '멤버' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('운영진')).toBeInTheDocument();
  });

  it('로그아웃하면 세션을 지우고 /login으로 보낸다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    render(<DesktopSidebar />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(await api.auth.getUser()).toBeNull();
    expect(nav.push).toHaveBeenCalledWith('/login');
  });

  it('로그아웃이 실패하면 토스트로 알리고 이동하지 않는다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    api.auth.signOut = vi.fn().mockRejectedValue(new Error('네트워크 오류'));
    render(<DesktopSidebar />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(toastError).toHaveBeenCalledWith('네트워크 오류');
    expect(nav.push).not.toHaveBeenCalled();
  });
});

describe('DesktopTopBar', () => {
  it('루트 화면은 제목만', () => {
    nav.pathname = '/votes';
    render(<DesktopTopBar />);
    expect(screen.getByText('투표')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '뒤로' })).toBeNull();
  });

  it('상세 화면은 뒤로가기 포함', () => {
    nav.pathname = '/matches/m-1';
    render(<DesktopTopBar />);
    expect(screen.getByRole('link', { name: '뒤로' })).toHaveAttribute('href', '/matches');
  });
});
