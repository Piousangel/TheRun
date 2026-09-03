export const DEFAULT_REDIRECT_PATH = '/dashboard';

/**
 * 로그인 후 되돌아갈 `next` 값이 "우리 앱 안의 경로"인지 판정한다.
 *
 * `/`로 시작하는지만 보면 `//evil.com`(프로토콜 상대 URL)과 `/\evil.com`(브라우저가
 * `//`로 정규화하는 변형)이 통과해 오픈 리다이렉트가 된다. 제어문자·공백은 브라우저가
 * URL 파싱 전에 지우기 때문에 `/\t/evil.com` 같은 값도 우회 수단이 된다 — 정규화해서
 * 받아주는 대신 통째로 거부한다.
 */
export function safeInternalPath(next: string | null | undefined, fallback: string = DEFAULT_REDIRECT_PATH): string {
  if (typeof next !== 'string' || next === '') return fallback;
  // 브라우저가 URL 파싱 전에 지우는 제어문자·공백이 섞여 있으면 통째로 거부한다.
  if (/[\u0000-\u0020\u007f]/.test(next)) return fallback;
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
