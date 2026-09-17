import { render } from '@testing-library/react';
import { TheRunLogo } from '@/shared/ui/the-run-logo';

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
