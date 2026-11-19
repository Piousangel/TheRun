'use client';

import { useSyncExternalStore } from 'react';

/** 데스크톱 기준 폭(OPERATING 4-1: md 이상 = 사이드바 셸). */
export const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * 미디어 쿼리 일치 여부. 서버 렌더와 첫 하이드레이션에서는 `null`(아직 모름)을 돌려준다.
 * 모바일 시트와 데스크톱 패널처럼 기기마다 다른 구성을 고를 때, 모르는 동안은 둘 다 그리지 않는다.
 */
export function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}
