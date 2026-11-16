import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { CardSkeleton } from '@/shared/ui/card-skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/empty-state';
import { ListCard, ListRow } from '@/shared/ui/list-card';
import { SectionHeader } from '@/shared/ui/section-header';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { StatusBadge } from '@/shared/ui/status-badge';

describe('SectionHeader', () => {
  it('제목과 우측 링크를 렌더한다', () => {
    render(<SectionHeader title="최근 공지" action={{ href: '/announcements', label: '전체 보기' }} />);
    expect(screen.getByRole('heading', { name: '최근 공지' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '전체 보기' })).toHaveAttribute('href', '/announcements');
  });
});

describe('ListCard / ListRow', () => {
  it('카드 전체가 링크이고 슬롯을 렌더한다', () => {
    render(<ListCard href="/votes/1" title="11/20 경기" badges={<StatusBadge tone="green">진행 중</StatusBadge>} meta="마감 18:00" timestamp="11/19" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/votes/1');
    expect(link).toHaveTextContent('진행 중');
    expect(link).toHaveTextContent('마감 18:00');
    expect(link).toHaveTextContent('11/19');
  });

  it('행은 제목·배지·메타를 가진 링크다', () => {
    render(<ListRow href="/members/1" title="김런" badge={<StatusBadge>가입됨</StatusBadge>} meta="GK" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/members/1');
    expect(screen.getByRole('link')).toHaveTextContent('김런');
  });
});

describe('StatusBadge', () => {
  it('tone에 맞는 토큰 클래스를 쓴다', () => {
    render(<StatusBadge tone="red">마감</StatusBadge>);
    expect(screen.getByText('마감')).toHaveClass('bg-signal-red-bg', 'text-signal-red-fg');
  });
});

describe('EmptyState / ErrorState', () => {
  it('빈 상태는 제목·설명·액션을 보여준다', () => {
    render(<EmptyState title="투표가 없어요" description="운영진이 열면 보여요" action={<button>만들기</button>} />);
    expect(screen.getByText('투표가 없어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '만들기' })).toBeInTheDocument();
  });

  it('오류 상태는 alert이고 다시 시도 버튼이 콜백을 부른다', async () => {
    const onRetry = vi.fn();
    render(<ErrorState title="불러오지 못했어요" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('onRetry가 없으면 버튼이 없다', () => {
    render(<ErrorState title="오류" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('CardSkeleton', () => {
  it('기본 4개, count로 조절한다', () => {
    const { rerender } = render(<CardSkeleton />);
    expect(screen.getAllByTestId('card-skeleton')).toHaveLength(4);
    rerender(<CardSkeleton count={2} />);
    expect(screen.getAllByTestId('card-skeleton')).toHaveLength(2);
  });
});

describe('SegmentedControl', () => {
  function Harness() {
    const [value, setValue] = useState<'open' | 'closed'>('open');
    return (
      <SegmentedControl
        ariaLabel="투표 상태"
        value={value}
        onChange={setValue}
        options={[
          { value: 'open', label: '진행 중' },
          { value: 'closed', label: '마감' },
        ]}
      />
    );
  }

  it('클릭하면 활성 옵션이 바뀐다', async () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: '진행 중' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: '마감' }));
    expect(screen.getByRole('tab', { name: '마감' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '진행 중' })).toHaveAttribute('aria-selected', 'false');
  });
});
