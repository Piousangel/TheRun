import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface StateBaseProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

function StateBase({ title, description, icon: Icon, action, role }: StateBaseProps & { icon: LucideIcon; role?: 'alert' }) {
  return (
    <div role={role} className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <Icon size={48} strokeWidth={1.5} aria-hidden className="text-ink-faint" />
      <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-[320px] text-sm text-ink-dim">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon = Inbox, ...props }: StateBaseProps) {
  return <StateBase icon={icon} {...props} />;
}

interface ErrorStateProps extends Omit<StateBaseProps, 'action'> {
  onRetry?: () => void;
}

export function ErrorState({ icon = AlertCircle, title = '불러오지 못했어요', description, onRetry }: ErrorStateProps) {
  return (
    <StateBase
      role="alert"
      icon={icon}
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry} className="min-h-[44px]">
            다시 시도
          </Button>
        ) : undefined
      }
    />
  );
}
