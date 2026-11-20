import type { ReactNode } from 'react';
import { IconInbox } from '@tabler/icons-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
  className?: string;
}

export const EmptyState =({
  icon,
  title = 'No data found',
  description = 'There are no items to display right now.',
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}: EmptyStateProps) =>{
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-subtle bg-surface/50 px-6 py-12 text-center ${className}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated text-ink-muted">
        {icon || <IconInbox className="h-6 w-6" stroke={1.75} />}
      </div>

      <h3 className="text-base font-semibold text-ink-primary">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-secondary">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} leftIcon={actionIcon}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}