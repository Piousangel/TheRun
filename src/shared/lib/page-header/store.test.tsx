import { renderHook } from '@testing-library/react';
import { usePageHeader, usePageHeaderStore } from '@/shared/lib/page-header/store';

describe('usePageHeader', () => {
  afterEach(() => usePageHeaderStore.getState().clearOverride());

  it('마운트하면 오버라이드를 설정하고 언마운트하면 지운다', () => {
    const { unmount } = renderHook(() => usePageHeader({ title: '9월 19일 정기 경기', backHref: '/votes' }));
    expect(usePageHeaderStore.getState().override).toEqual({ title: '9월 19일 정기 경기', backHref: '/votes' });
    unmount();
    expect(usePageHeaderStore.getState().override).toBeNull();
  });

  it('제목이 바뀌면 오버라이드도 바뀐다', () => {
    const { rerender } = renderHook(({ title }) => usePageHeader({ title }), { initialProps: { title: '불러오는 제목' } });
    rerender({ title: '실제 제목' });
    expect(usePageHeaderStore.getState().override?.title).toBe('실제 제목');
  });
});
