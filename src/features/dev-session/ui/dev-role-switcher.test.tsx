import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DevRoleSwitcher } from '@/features/dev-session/ui/dev-role-switcher';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

describe('DevRoleSwitcher', () => {
  afterEach(() => {
    __setApiForTests(null);
    push.mockClear();
    refresh.mockClear();
  });

  it('계정 버튼을 누르면 데모 로그인 후 /dashboard로 이동한다', async () => {
    const { api, wrapper } = setupTestApi();
    render(<DevRoleSwitcher />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '관리자' }));
    expect((await api.auth.getUser())?.id).toBe('u-admin');
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('로그아웃 버튼은 세션을 지우고 /login으로 보낸다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    render(<DevRoleSwitcher />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(await api.auth.getUser()).toBeNull();
    expect(push).toHaveBeenCalledWith('/login');
  });
});
