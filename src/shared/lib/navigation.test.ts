import { safeInternalPath } from '@/shared/lib/navigation';

describe('safeInternalPath', () => {
  it('내부 절대 경로는 그대로 통과한다', () => {
    expect(safeInternalPath('/dashboard')).toBe('/dashboard');
    expect(safeInternalPath('/matches/mt-1?tab=stats#top')).toBe('/matches/mt-1?tab=stats#top');
  });

  it('프로토콜 상대 URL(//evil.com)을 거부한다', () => {
    expect(safeInternalPath('//evil.com')).toBe('/dashboard');
    expect(safeInternalPath('//evil.com/path')).toBe('/dashboard');
  });

  it('백슬래시 변형(/\\evil.com)을 거부한다', () => {
    expect(safeInternalPath('/\\evil.com')).toBe('/dashboard');
    expect(safeInternalPath('/\\/evil.com')).toBe('/dashboard');
  });

  it('절대 URL과 스킴을 거부한다', () => {
    expect(safeInternalPath('https://evil.com')).toBe('/dashboard');
    expect(safeInternalPath('javascript:alert(1)')).toBe('/dashboard');
    expect(safeInternalPath('dashboard')).toBe('/dashboard');
  });

  it('브라우저가 무시하는 제어문자·공백이 섞이면 거부한다', () => {
    expect(safeInternalPath('/\t/evil.com')).toBe('/dashboard');
    expect(safeInternalPath(' //evil.com')).toBe('/dashboard');
    expect(safeInternalPath('\n/members', '/login')).toBe('/login');
  });

  it('빈 값이면 폴백을 쓴다', () => {
    expect(safeInternalPath(null)).toBe('/dashboard');
    expect(safeInternalPath(undefined)).toBe('/dashboard');
    expect(safeInternalPath('')).toBe('/dashboard');
    expect(safeInternalPath('//evil.com', '/login')).toBe('/login');
  });
});
