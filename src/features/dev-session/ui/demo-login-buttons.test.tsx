import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoLoginButtons } from '@/features/dev-session/ui/demo-login-buttons';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

describe('DemoLoginButtons', () => {
  afterEach(() => {
    __setApiForTests(null);
    push.mockClear();
    refresh.mockClear();
    toastError.mockClear();
  });

  it('데모 로그인 후 next 경로로 이동한다', async () => {
    const { api, wrapper } = setupTestApi();
    render(<DemoLoginButtons nextPath="/matches" />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '멤버로 체험하기' }));
    expect((await api.auth.getUser())?.id).toBe('u-member');
    expect(push).toHaveBeenCalledWith('/matches');
  });

  it('외부로 나가는 next 값은 무시하고 /dashboard로 보낸다', async () => {
    const { wrapper } = setupTestApi();
    render(<DemoLoginButtons nextPath="//evil.com" />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '멤버로 체험하기' }));
    expect(push).toHaveBeenCalledWith('/dashboard');
    expect(push).not.toHaveBeenCalledWith('//evil.com');
  });

  it('로그인이 실패하면 토스트로 알리고 이동하지 않는다', async () => {
    const { api, wrapper } = setupTestApi();
    api.auth.signInAsDemo = vi.fn().mockRejectedValue(new Error('데모 계정 u-member이(가) 시드에 없습니다.'));
    render(<DemoLoginButtons nextPath="/dashboard" />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '멤버로 체험하기' }));
    expect(toastError).toHaveBeenCalledWith('데모 계정 u-member이(가) 시드에 없습니다.');
    expect(push).not.toHaveBeenCalled();
  });
});
