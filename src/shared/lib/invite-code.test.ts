import { formatInviteCode, generateInviteCode, hashInviteCode, isPlausibleInviteCode, normalizeInviteCode } from '@/shared/lib/invite-code';

describe('invite-code', () => {
  it('생성 코드는 RUN-XXXX-XXXX 형식이고 혼동 문자가 없다', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateInviteCode()).toMatch(/^RUN-[2-9A-HJKMNP-TV-Z]{4}-[2-9A-HJKMNP-TV-Z]{4}$/);
    }
  });

  it('정규화는 대소문자·하이픈·공백을 무시한다', () => {
    expect(normalizeInviteCode(' run-ab23-cd45 ')).toBe('RUNAB23CD45');
    expect(formatInviteCode('RUNAB23CD45')).toBe('RUN-AB23-CD45');
  });

  it('입력 형식 검사: 접두사 유무 모두 허용, 짧으면 거부', () => {
    expect(isPlausibleInviteCode('run-ab23-cd45')).toBe(true);
    expect(isPlausibleInviteCode('ab23cd45')).toBe(true);
    expect(isPlausibleInviteCode('ab23')).toBe(false);
  });

  it('해시는 표기 차이와 무관하고 SHA-256 hex다', async () => {
    const a = await hashInviteCode('RUN-AB23-CD45');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashInviteCode(' run ab23 cd45')).toBe(a);
    expect(await hashInviteCode('RUN-AB23-CD46')).not.toBe(a);
  });
});
