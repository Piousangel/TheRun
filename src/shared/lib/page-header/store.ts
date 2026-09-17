import { useEffect } from 'react';
import { create } from 'zustand';

export interface PageHeaderOverride {
  title?: string;
  subtitle?: string;
  backHref?: string;
}

interface PageHeaderState {
  override: PageHeaderOverride | null;
  setOverride: (override: PageHeaderOverride) => void;
  clearOverride: () => void;
}

/** 셸 헤더(모바일 상단·데스크톱 상단바)의 제목을 페이지가 덮어쓸 때 쓴다. 기본값은 navigation.ts의 라우트 메타. */
export const usePageHeaderStore = create<PageHeaderState>((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
  clearOverride: () => set({ override: null }),
}));

export function usePageHeader({ title, subtitle, backHref }: PageHeaderOverride): void {
  useEffect(() => {
    const override: PageHeaderOverride = {};
    if (title !== undefined) override.title = title;
    if (subtitle !== undefined) override.subtitle = subtitle;
    if (backHref !== undefined) override.backHref = backHref;
    usePageHeaderStore.getState().setOverride(override);
    return () => usePageHeaderStore.getState().clearOverride();
  }, [title, subtitle, backHref]);
}
