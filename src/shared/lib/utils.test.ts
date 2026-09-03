import { normalizePhoneNumber, getMemberPhoneDisplay, MASKED_MEMBER_PHONE_NUMBER } from '@/shared/lib/utils';

describe('normalizePhoneNumber', () => {
  it('11자리 숫자를 010-0000-0000 형식으로 만든다', () => {
    expect(normalizePhoneNumber('01012345678')).toBe('010-1234-5678');
    expect(normalizePhoneNumber(' 010 1234 5678 ')).toBe('010-1234-5678');
  });

  it('11자리가 아니면 trim만 한다', () => {
    expect(normalizePhoneNumber(' 1234 ')).toBe('1234');
  });
});

describe('getMemberPhoneDisplay', () => {
  it('마스킹 번호는 비공개로 표시한다', () => {
    expect(getMemberPhoneDisplay(MASKED_MEMBER_PHONE_NUMBER)).toBe('연락처 비공개');
    expect(getMemberPhoneDisplay('010-1234-5678')).toBe('010-1234-5678');
  });
});
