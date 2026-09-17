import { useEffect, useId } from 'react';
import { create } from 'zustand';

export interface PageHeaderOverride {
  title?: string;
  subtitle?: string;
  backHref?: string;
}

interface PageHeaderState {
  /** 현재 오버라이드를 설정한 소비자(usePageHeader 인스턴스)의 id */
  owner: string | null;
  override: PageHeaderOverride | null;
  setOverride: (owner: string, override: PageHeaderOverride) => void;
  /** owner가 현재 소유자와 같을 때만 지운다. 화면 전환 중 이전 화면의 언마운트가 새 화면의 제목을 지우지 않게. */
  clearOverride: (owner: string) => void;
}

/** 셸 헤더(모바일 상단·데스크톱 상단바)의 제목을 페이지가 덮어쓸 때 쓴다. 기본값은 navigation.ts의 라우트 메타. */
export const usePageHeaderStore = create<PageHeaderState>((set, get) => ({
  owner: null,
  override: null,
  setOverride: (owner, override) => set({ owner, override }),
  clearOverride: (owner) => {
    if (get().owner === owner) set({ owner: null, override: null });
  },
}));

export function usePageHeader({ title, subtitle, backHref }: PageHeaderOverride): void {
  const owner = useId();
  useEffect(() => {
    const override: PageHeaderOverride = {};
    if (title !== undefined) override.title = title;
    if (subtitle !== undefined) override.subtitle = subtitle;
    if (backHref !== undefined) override.backHref = backHref;
    usePageHeaderStore.getState().setOverride(owner, override);
    return () => usePageHeaderStore.getState().clearOverride(owner);
  }, [owner, title, subtitle, backHref]);
}
