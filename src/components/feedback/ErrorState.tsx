import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { Button } from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  className?: string;
}

export const ErrorState =({
  title = 'Something went wrong',
  message = 'We could not load this data. Please check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
  isRetrying = false,
  className = '',
}: ErrorStateProps)=> {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-2xl border border-expense/25 bg-expense/5 px-6 py-12 text-center ${className}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-expense/15 text-expense">
        <IconAlertCircle className="h-6 w-6" stroke={1.75} />
      </div>

      <h3 className="text-base font-semibold text-ink-primary">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-secondary">
        {message}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            onClick={onRetry}
            isLoading={isRetrying}
            leftIcon={<IconRefresh className="h-4 w-4" stroke={1.75} />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}