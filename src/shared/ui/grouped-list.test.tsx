import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bell, LogOut } from 'lucide-react';
import { GroupedList, GroupedListItem } from '@/shared/ui/grouped-list';

describe('GroupedList', () => {
  it('라벨과 링크 항목을 렌더한다', () => {
    render(
      <GroupedList label="클럽">
        <GroupedListItem icon={Bell} label="공지" href="/announcements" />
      </GroupedList>,
    );
    expect(screen.getByRole('heading', { name: '클럽' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '공지' })).toHaveAttribute('href', '/announcements');
  });

  it('href 없이 onClick이면 버튼으로 렌더한다', async () => {
    const onClick = vi.fn();
    render(
      <GroupedList>
        <GroupedListItem icon={LogOut} label="로그아웃" tone="danger" onClick={onClick} />
      </GroupedList>,
    );
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
