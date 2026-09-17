import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MorePageContent } from '@/widgets/more/ui/more-page-content';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const auth = vi.hoisted(() => ({
  isAdmin: false,
  member: { name: '이서준' },
  profile: { role: 'member' as 'member' | 'admin' | 'superadmin' },
}));
vi.mock('@/providers/auth-provider', () => ({ useAuth: () => auth }));

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

afterEach(() => {
  __setApiForTests(null);
  router.push.mockClear();
  auth.isAdmin = false;
  auth.profile = { role: 'member' };
  toastError.mockClear();
});

describe('MorePageContent', () => {
  it('프로필과 멤버용 메뉴를 보여준다', () => {
    const { wrapper } = setupTestApi();
    render(<MorePageContent />, { wrapper });
    expect(screen.getByRole('heading', { level: 1, name: '더보기' })).toBeInTheDocument();
    expect(screen.getByText('이서준')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '공지' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '내 정보' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '멤버' })).toBeNull();
  });

  it('관리자에게는 운영 메뉴가 보인다', () => {
    auth.isAdmin = true;
    auth.profile = { role: 'admin' };
    const { wrapper } = setupTestApi();
    render(<MorePageContent />, { wrapper });
    expect(screen.getByRole('link', { name: '멤버' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '전략·팀 편성' })).toBeInTheDocument();
  });

  it('로그아웃하면 /login으로 보낸다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    render(<MorePageContent />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(await api.auth.getUser()).toBeNull();
    expect(router.push).toHaveBeenCalledWith('/login');
  });

  it('로그아웃이 실패하면 토스트로 알리고 이동하지 않는다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    api.auth.signOut = vi.fn().mockRejectedValue(new Error('네트워크 오류'));
    render(<MorePageContent />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(toastError).toHaveBeenCalledWith('네트워크 오류');
    expect(router.push).not.toHaveBeenCalled();
  });
});
