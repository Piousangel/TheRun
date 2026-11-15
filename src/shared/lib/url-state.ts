/**
 * URL 상태 유틸: 시트·탭·필터·단계형 폼 단계를 쿼리스트링으로 표현한다.
 * (스펙 owner-brief 6장 "뒤로가기가 항상 예상대로 동작한다")
 *
 * 순수 함수만 둔다. 훅은 `@/shared/lib/use-url-state`.
 */

export type UrlStateValue = string | null | undefined;

/**
 * 현재 쿼리스트링에 key=value를 반영한 새 href(pathname + search)를 만든다.
 * value가 null/undefined/빈 문자열이면 key를 지운다. 다른 키는 그대로 둔다.
 */
export function buildUrlWithParam(
  pathname: string,
  search: string | URLSearchParams,
  key: string,
  value: UrlStateValue,
): string {
  const params = new URLSearchParams(typeof search === 'string' ? search : search.toString());
  if (value === null || value === undefined || value === '') {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** 허용 목록에 있는 값만 돌려준다. 없거나 알 수 없는 값이면 fallback. 손상된 URL이 화면을 깨지 않게 한다. */
export function parseEnumParam<T extends string>(
  raw: string | null | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return raw !== null && raw !== undefined && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

/** 1 이상의 정수 단계값(예: 단계형 폼의 step). 잘못된 값은 fallback. */
export function parseStepParam(raw: string | null | undefined, max: number, fallback = 1): number {
  if (raw === null || raw === undefined || !/^\d+$/.test(raw)) return fallback;
  const n = Number(raw);
  return n >= 1 && n <= max ? n : fallback;
}
