'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buildUrlWithParam, type UrlStateValue } from '@/shared/lib/url-state';

/**
 * 쿼리 파라미터 하나를 상태처럼 읽고 쓴다.
 * - `push`(기본): 시트·모달·단계 — 뒤로가기로 닫히거나 이전 단계로 돌아간다.
 * - `replace`: 필터·정렬처럼 히스토리를 쌓지 않을 값.
 * 새로고침해도 같은 화면이 나온다.
 *
 * `shallow: true`면 Next 라우터 대신 `history.pushState/replaceState`로 바꾼다. 서버 왕복(RSC 요청)이 없어서
 * **연결이 끊겨도** 시트·쿼터 전환이 된다(경기 기록 화면, 스펙 §2.3 오프라인 우선). Next 14.1+는 네이티브
 * history 호출을 `useSearchParams`와 동기화한다. 서버 컴포넌트가 searchParams를 읽는 화면에는 쓰지 않는다.
 * (2026-11-25 e2e에서 발견: 오프라인에서 router.push가 RSC 요청 실패로 시트를 못 열었다)
 */
export function useUrlState(key: string, mode: 'push' | 'replace' = 'push', { shallow = false }: { shallow?: boolean } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(key);

  const setValue = useCallback(
    (next: UrlStateValue) => {
      const href = buildUrlWithParam(pathname, searchParams.toString(), key, next);
      if (shallow) {
        if (mode === 'replace') window.history.replaceState(null, '', href);
        else window.history.pushState(null, '', href);
        return;
      }
      if (mode === 'replace') router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [router, pathname, searchParams, key, mode, shallow],
  );

  return [value, setValue] as const;
}
