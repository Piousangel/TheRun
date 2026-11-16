import { render } from '@testing-library/react';
import { TheRunBadge, TheRunLogo } from '@/shared/ui/the-run-logo';

describe('TheRunLogo (TR 모노그램, 2026-11-16 최종)', () => {
  it('기본값은 그림자 없음', () => {
    const { container } = render(<TheRunLogo className="h-7 w-7" />);
    expect(container.querySelector('svg')?.getAttribute('class')).not.toContain('drop-shadow');
  });

  it('glow면 drop-shadow를 붙인다', () => {
    const { container } = render(<TheRunLogo tone="light" glow />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('drop-shadow');
  });

  it('브랜드 톤: T 흰색 · R 금색 · 공 초록, 그라데이션·마스크 없음', () => {
    const { container } = render(<TheRunLogo />);
    expect(container.querySelector('linearGradient')).toBeNull();
    expect(container.querySelector('mask')).toBeNull();
    const rects = [...container.querySelectorAll('rect')].map((n) => n.getAttribute('fill'));
    expect(new Set(rects)).toEqual(new Set(['#F8F7F3']));
    const paths = [...container.querySelectorAll('path')].map((n) => n.getAttribute('fill'));
    expect(paths).toEqual(['#C8A858', '#30A46C']);
  });

  it('밝은 배경 톤: T 검정 · R 진한 금색 · 공 진한 초록', () => {
    const { container } = render(<TheRunLogo tone="brandOnLight" />);
    expect(container.querySelector('rect')?.getAttribute('fill')).toBe('#111114');
    const paths = [...container.querySelectorAll('path')].map((n) => n.getAttribute('fill'));
    expect(paths).toEqual(['#8A6D1F', '#218358']);
  });

  it('구멍은 evenodd로 낸다(R 속 공간, 공 무늬)', () => {
    const { container } = render(<TheRunLogo />);
    expect(container.querySelectorAll('path[fill-rule="evenodd"]')).toHaveLength(2);
  });

  it('small이면 단순한 공 경로를 쓴다', () => {
    const full = render(<TheRunLogo />).container.querySelectorAll('path')[1].getAttribute('d')!;
    const small = render(<TheRunLogo small />).container.querySelectorAll('path')[1].getAttribute('d')!;
    expect(small.length).toBeLessThan(full.length);
  });
});

describe('TheRunBadge', () => {
  it('검정 타일 안에 브랜드 마크', () => {
    const { container } = render(<TheRunBadge />);
    expect(container.querySelector('span')?.className).toContain('bg-[#111114]');
    expect(container.querySelector('path')?.getAttribute('fill')).toBe('#C8A858');
  });
});
