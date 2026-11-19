/** 초대 코드 규격: `RUN-XXXX-XXXX`. Crockford base32에서 혼동 문자(I, L, O, U, 0, 1)를 뺀 알파벳 8자(약 40비트). */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

/** DB `normalize_invite_code`와 같은 규칙: 영숫자만 남기고 대문자로. */
export function normalizeInviteCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function formatInviteCode(normalized: string): string {
  return `RUN-${normalized.slice(-8, -4)}-${normalized.slice(-4)}`;
}

/** 입력이 `RUN` 접두사를 포함한 11자(RUN + 8자)로 정규화되는지. 접두사 없이 8자만 쳐도 허용한다. */
export function isPlausibleInviteCode(input: string): boolean {
  const n = normalizeInviteCode(input);
  return n.length === 8 || (n.length === 11 && n.startsWith('RUN'));
}

export function generateInviteCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  // 256 % 30 != 0 이라 편향이 생기지만 30개 중 8자라 40비트 안전성에는 영향이 없다.
  const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `RUN-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** SHA-256 hex. DB `hash_invite_code`와 같은 입력(정규화된 문자열)을 해시한다. */
export async function hashInviteCode(input: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeInviteCode(input));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
