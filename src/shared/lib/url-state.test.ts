import { describe, expect, it } from 'vitest';
import { buildUrlWithParam, parseEnumParam, parseStepParam } from '@/shared/lib/url-state';

describe('buildUrlWithParam', () => {
  it('키를 추가하고 다른 키는 유지한다', () => {
    expect(buildUrlWithParam('/matches', 'tab=a', 'sheet', 'goal')).toBe('/matches?tab=a&sheet=goal');
  });
  it('기존 키를 덮어쓴다', () => {
    expect(buildUrlWithParam('/m', 'sheet=a', 'sheet', 'b')).toBe('/m?sheet=b');
  });
  it('null·빈 값이면 키를 지우고 남은 게 없으면 ? 없이 돌려준다', () => {
    expect(buildUrlWithParam('/m', 'sheet=a', 'sheet', null)).toBe('/m');
    expect(buildUrlWithParam('/m', 'sheet=a&x=1', 'sheet', '')).toBe('/m?x=1');
  });
  it('URLSearchParams도 받는다', () => {
    expect(buildUrlWithParam('/m', new URLSearchParams('x=1'), 'y', '한글')).toBe('/m?x=1&y=%ED%95%9C%EA%B8%80');
  });
});

describe('parseEnumParam', () => {
  const tabs = ['table', 'players'] as const;
  it('허용 값은 통과', () => expect(parseEnumParam('players', tabs, 'table')).toBe('players'));
  it('모르는 값·null은 fallback', () => {
    expect(parseEnumParam('x', tabs, 'table')).toBe('table');
    expect(parseEnumParam(null, tabs, 'table')).toBe('table');
  });
});

describe('parseStepParam', () => {
  it('범위 안 정수만 통과', () => {
    expect(parseStepParam('2', 3)).toBe(2);
    expect(parseStepParam('0', 3)).toBe(1);
    expect(parseStepParam('4', 3)).toBe(1);
    expect(parseStepParam('1.5', 3)).toBe(1);
    expect(parseStepParam('abc', 3, 2)).toBe(2);
    expect(parseStepParam(null, 3)).toBe(1);
  });
});
