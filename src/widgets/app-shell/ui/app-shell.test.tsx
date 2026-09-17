import { render, screen } from '@testing-library/react';
import { AppShell } from '@/widgets/app-shell/ui/app-shell';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const nav = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ member: null, profile: null, isAdmin: false }),
}));

afterEach(() => {
  nav.pathname = '/dashboard';
});

describe('AppShell', () => {
  it('앱 화면에서는 탭바·사이드바와 main을 렌더한다', () => {
    const { wrapper } = setupTestApi();
    render(<AppShell><p>본문</p></AppShell>, { wrapper });
    expect(screen.getByRole('navigation', { name: '주요 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '사이드 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('본문');
  });

  it('로그인 화면에서는 셸 없이 children만', () => {
    nav.pathname = '/login';
    const { wrapper } = setupTestApi();
    render(<AppShell><p>로그인 폼</p></AppShell>, { wrapper });
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('main')).toBeNull();
    expect(screen.getByText('로그인 폼')).toBeInTheDocument();
  });

  it('앱 화면에서는 main이 정확히 하나만 렌더된다', () => {
    nav.pathname = '/votes';
    const { wrapper } = setupTestApi();
    render(<AppShell><p>투표 목록</p></AppShell>, { wrapper });
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });
});
