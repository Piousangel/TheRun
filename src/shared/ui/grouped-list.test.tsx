import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bell, FlaskConical, LogOut } from 'lucide-react';
import { GroupedList, GroupedListButton, GroupedListItem } from '@/shared/ui/grouped-list';

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

describe('GroupedListButton', () => {
  it('ref와 나머지 props를 버튼에 넘겨 트리거 자식으로 쓸 수 있다', async () => {
    const onClick = vi.fn();
    const ref = { current: null as HTMLButtonElement | null };
    render(<GroupedListButton ref={ref} icon={FlaskConical} label="데모 모드" aria-haspopup="dialog" onClick={onClick} />);
    const button = screen.getByRole('button', { name: '데모 모드' });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
