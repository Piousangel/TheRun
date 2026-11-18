import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import GlobalError from '@/app/global-error';
import RouteError from '@/app/error';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

describe('오류 화면', () => {
  it('라우트 오류: 안내와 다시 시도·홈 링크를 보여주고 reset을 호출한다', async () => {
    const reset = vi.fn();
    render(<RouteError error={new Error('boom')} reset={reset} />);
    expect(screen.getByRole('alert')).toHaveTextContent('문제가 생겼어요');
    expect(screen.getByRole('link', { name: '홈으로 가기' })).toHaveAttribute('href', '/dashboard');
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('전역 오류: 다시 시도 버튼이 reset을 호출한다', async () => {
    const reset = vi.fn();
    render(<GlobalError error={new Error('boom')} reset={reset} />, { container: document.documentElement });
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
