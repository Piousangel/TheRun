/** 128비트 난수를 hex로. getRandomValues는 보안 컨텍스트가 아니어도 쓸 수 있다. */
function randomHex(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 브라우저에서 쓰는 id 생성기. 로컬 어댑터의 모든 쓰기와 업로드 임시 키가 이걸 쓴다.
 *
 * `crypto.randomUUID`는 보안 컨텍스트(https·localhost)에서만 존재한다. 폰에서 LAN IP로
 * 데모를 여는 흔한 경로(http://192.168.x.x:3000)에서는 undefined라 그대로 부르면 TypeError로 죽는다.
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${randomHex()}`;
}
