// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { contrastRatio } from '@/shared/lib/color/contrast';

const css = readFileSync(path.resolve(__dirname, '../../../app/globals.css'), 'utf8');

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!match) throw new Error(`globals.css에 --${name} hex 토큰이 없습니다`);
  return match[1];
}

describe('contrastRatio', () => {
  it('흑/백은 21:1, 같은 색은 1:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#C8A858', '#C8A858')).toBeCloseTo(1, 5);
  });
});

describe('globals.css 토큰 대비(WCAG AA 4.5:1)', () => {
  const pairs: Array<[fg: string, bg: string]> = [
    ['fg', 'bg'],
    ['fg-muted', 'bg'],
    ['fg-muted', 'bg-sunken-strong'],
    ['fg-dim', 'bg'],
    ['fg-dim', 'bg-sunken'],
    ['brand-dark', 'bg'],
    ['brand-dark', 'brand-soft'],
    ['fg', 'brand'],
    ['signal-red-fg', 'signal-red-bg'],
    ['signal-amber-fg', 'signal-amber-bg'],
    ['signal-blue-fg', 'signal-blue-bg'],
    ['signal-green-fg', 'signal-green-bg'],
    ['signal-gray-fg', 'signal-gray-bg'],
  ];

  it.each(pairs)('%s on %s ≥ 4.5', (fg, bg) => {
    expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });
});
