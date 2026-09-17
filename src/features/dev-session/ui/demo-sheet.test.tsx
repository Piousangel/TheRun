import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoSheet } from '@/features/dev-session/ui/demo-sheet';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

function renderSheet(wrapper: ReturnType<typeof setupTestApi>['wrapper']) {
  return render(
    <DemoSheet>
      <button type="button">데모 트리거</button>
    </DemoSheet>,
    { wrapper },
  );
}

async function openSheet() {
  await userEvent.click(screen.getByRole('button', { name: '데모 트리거' }));
}

describe('DemoSheet', () => {
  afterEach(() => {
    __setApiForTests(null);
    push.mockClear();
    refresh.mockClear();
    toastError.mockClear();
  });

  it('처음에는 트리거만 보이고 계정 버튼은 숨어 있다', () => {
    const { wrapper } = setupTestApi();
    renderSheet(wrapper);
    expect(screen.getByRole('button', { name: '데모 트리거' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '관리자' })).toBeNull();
  });

  it('트리거를 누르면 시트가 열린다', async () => {
    const { wrapper } = setupTestApi();
    renderSheet(wrapper);
    await openSheet();
    expect(await screen.findByRole('heading', { name: '데모 모드' })).toBeInTheDocument();
    expect(screen.getByText('화면 미리보기입니다. 입력한 내용은 이 기기에만 남고 다른 사람에게 보이지 않습니다.')).toBeInTheDocument();
  });

  it('계정 버튼을 누르면 데모 로그인 후 /dashboard로 이동한다', async () => {
    const { api, wrapper } = setupTestApi();
    renderSheet(wrapper);
    await openSheet();
    await userEvent.click(await screen.findByRole('button', { name: '관리자' }));
    expect((await api.auth.getUser())?.id).toBe('u-admin');
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('로그아웃 버튼은 세션을 지우고 /login으로 보낸다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    renderSheet(wrapper);
    await openSheet();
    await userEvent.click(await screen.findByRole('button', { name: '로그아웃' }));
    expect(await api.auth.getUser()).toBeNull();
    expect(push).toHaveBeenCalledWith('/login');
  });

  it('데이터 초기화는 확인 단계를 거친다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    renderSheet(wrapper);
    await openSheet();
    await userEvent.click(await screen.findByRole('button', { name: '데이터 초기화' }));
    expect(await api.auth.getUser()).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: '초기화 실행' }));
    expect(await api.auth.getUser()).toBeNull();
    expect(push).toHaveBeenCalledWith('/login');
  });

  it('데모 계정 전환이 실패하면 토스트로 알리고 이동하지 않으며 버튼이 다시 활성화된다', async () => {
    const { api, wrapper } = setupTestApi();
    api.auth.signInAsDemo = vi.fn().mockRejectedValue(new Error('데모 계정 u-superadmin이(가) 시드에 없습니다.'));
    renderSheet(wrapper);
    await openSheet();
    const button = await screen.findByRole('button', { name: '슈퍼관리자' });
    await userEvent.click(button);
    expect(toastError).toHaveBeenCalledWith('데모 계정 u-superadmin이(가) 시드에 없습니다.');
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '슈퍼관리자' })).toBeEnabled();
  });
});
