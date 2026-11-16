import { classifyCheckin, isCheckinWindowOpen } from '@/shared/lib/checkin-time';

// KST = UTC+9. 2026-11-21 06:30 KST = 2026-11-20T21:30Z
const kst = (hhmm: string, date = '2026-11-21') => new Date(`${date}T${hhmm}:00+09:00`);

describe('checkin-time', () => {
  it('06:30까지는 정시, 06:31부터 지각', () => {
    expect(classifyCheckin(kst('06:29'))).toBe('on_time');
    expect(classifyCheckin(kst('06:30'))).toBe('on_time');
    expect(classifyCheckin(kst('06:31'))).toBe('late');
  });

  it('체크인 창은 당일 05:30~08:00(KST)', () => {
    expect(isCheckinWindowOpen('2026-11-21', kst('05:29'))).toBe(false);
    expect(isCheckinWindowOpen('2026-11-21', kst('05:30'))).toBe(true);
    expect(isCheckinWindowOpen('2026-11-21', kst('08:00'))).toBe(true);
    expect(isCheckinWindowOpen('2026-11-21', kst('08:01'))).toBe(false);
  });

  it('다른 날짜에는 열리지 않고, UTC 날짜가 달라도 KST 기준으로 판단한다', () => {
    expect(isCheckinWindowOpen('2026-11-21', kst('06:00', '2026-11-20'))).toBe(false);
    // 06:00 KST는 UTC로는 전날 21:00
    expect(isCheckinWindowOpen('2026-11-21', new Date('2026-11-20T21:00:00Z'))).toBe(true);
  });
});
