'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buildUrlWithParam, type UrlStateValue } from '@/shared/lib/url-state';

/**
 * 쿼리 파라미터 하나를 상태처럼 읽고 쓴다.
 * - `push`(기본): 시트·모달·단계 — 뒤로가기로 닫히거나 이전 단계로 돌아간다.
 * - `replace`: 필터·정렬처럼 히스토리를 쌓지 않을 값.
 * 새로고침해도 같은 화면이 나온다.
 */
export function useUrlState(key: string, mode: 'push' | 'replace' = 'push') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(key);

  const setValue = useCallback(
    (next: UrlStateValue) => {
      const href = buildUrlWithParam(pathname, searchParams.toString(), key, next);
      if (mode === 'replace') router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [router, pathname, searchParams, key, mode],
  );

  return [value, setValue] as const;
}
