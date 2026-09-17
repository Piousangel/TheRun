import { act, renderHook } from '@testing-library/react';
import { usePageHeader, usePageHeaderStore } from '@/shared/lib/page-header/store';

describe('usePageHeader', () => {
  afterEach(() => {
    act(() => {
      usePageHeaderStore.setState({ owner: null, override: null });
    });
  });

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

  it('먼저 마운트된 소비자가 언마운트돼도 나중 소비자의 오버라이드는 남는다', () => {
    const older = renderHook(() => usePageHeader({ title: '이전 화면' }));
    const newer = renderHook(() => usePageHeader({ title: '새 화면' }));
    expect(usePageHeaderStore.getState().override?.title).toBe('새 화면');
    older.unmount();
    expect(usePageHeaderStore.getState().override?.title).toBe('새 화면');
    newer.unmount();
    expect(usePageHeaderStore.getState().override).toBeNull();
  });

  it('clearOverride는 소유자가 다르면 무시한다', () => {
    act(() => {
      usePageHeaderStore.getState().setOverride('a', { title: 'A' });
    });
    act(() => {
      usePageHeaderStore.getState().clearOverride('b');
    });
    expect(usePageHeaderStore.getState().override?.title).toBe('A');
    act(() => {
      usePageHeaderStore.getState().clearOverride('a');
    });
    expect(usePageHeaderStore.getState().override).toBeNull();
  });
});
