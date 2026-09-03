import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DevRoleSwitcher } from '@/features/dev-session/ui/dev-role-switcher';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

describe('DevRoleSwitcher', () => {
  afterEach(() => {
    __setApiForTests(null);
    push.mockClear();
    refresh.mockClear();
    toastError.mockClear();
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

  it('데모 계정 전환이 실패하면 토스트로 알리고 이동하지 않는다', async () => {
    const { api, wrapper } = setupTestApi();
    api.auth.signInAsDemo = vi.fn().mockRejectedValue(new Error('데모 계정 u-superadmin이(가) 시드에 없습니다.'));
    render(<DevRoleSwitcher />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '슈퍼관리자' }));
    expect(toastError).toHaveBeenCalledWith('데모 계정 u-superadmin이(가) 시드에 없습니다.');
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '슈퍼관리자' })).not.toBeDisabled();
  });
});
