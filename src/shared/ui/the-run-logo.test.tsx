import { render } from '@testing-library/react';
import { TheRunBadge, TheRunLogo } from '@/shared/ui/the-run-logo';

describe('TheRunLogo', () => {
  it('기본값은 그림자 없음', () => {
    const { container } = render(<TheRunLogo className="h-7 w-7" />);
    expect(container.querySelector('svg')?.getAttribute('class')).not.toContain('drop-shadow');
  });

  it('glow면 drop-shadow를 붙인다', () => {
    const { container } = render(<TheRunLogo tone="light" glow />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('drop-shadow');
  });
});

describe('TheRunLogo 마크(2026-11-16)', () => {
  it('단색: 모든 도형이 같은 색이고 그라데이션이 없다', () => {
    const { container } = render(<TheRunLogo tone="brand" />);
    expect(container.querySelector('linearGradient')).toBeNull();
    const fills = [...container.querySelectorAll('rect, path[fill]')].map((n) => n.getAttribute('fill'));
    expect(new Set(fills)).toEqual(new Set(['#C8A858']));
  });

  it('밝은 배경용 톤은 진한 금색을 쓴다', () => {
    const { container } = render(<TheRunLogo tone="brandOnLight" />);
    expect(container.querySelector('rect')?.getAttribute('fill')).toBe('#8A6D1F');
  });

  it('공 구멍은 evenodd로 낸다(마스크 없음)', () => {
    const { container } = render(<TheRunLogo />);
    expect(container.querySelector('mask')).toBeNull();
    expect(container.querySelector('path[fill-rule="evenodd"]')).not.toBeNull();
  });
});

describe('TheRunBadge', () => {
  it('검정 타일 안에 금색 마크', () => {
    const { container } = render(<TheRunBadge />);
    expect(container.querySelector('span')?.className).toContain('bg-[#111114]');
    expect(container.querySelector('rect')?.getAttribute('fill')).toBe('#C8A858');
  });
});

describe('TR 모노그램(2026-11-16 2차)', () => {
  it('T 가로대와 R 줄기 두 개의 막대, 볼과 축구공 두 개의 evenodd 경로', () => {
    const { container } = render(<TheRunLogo />);
    expect(container.querySelectorAll('rect')).toHaveLength(2);
    expect(container.querySelectorAll('path[fill-rule="evenodd"]')).toHaveLength(2);
  });
});
