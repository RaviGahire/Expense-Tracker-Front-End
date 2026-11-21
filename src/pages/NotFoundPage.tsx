import { useNavigate } from 'react-router-dom';
import {
  IconCompassOff,
  IconArrowLeft,
  IconLayoutDashboard,
} from '@tabler/icons-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md space-y-6 p-6 text-center sm:p-8">
        {/* Icon Badge */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand">
          <IconCompassOff className="h-7 w-7" stroke={1.75} />
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <span className="inline-block rounded-full border border-subtle bg-surface-elevated/60 px-3 py-1 text-xs font-bold tracking-wider text-ink-secondary uppercase">
            Error 404
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
            Page Not Found
          </h1>
          <p className="text-sm leading-relaxed text-ink-secondary">
            The page you are looking for does not exist or may have been moved.
            Head back to your financial overview or return to the previous page.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse items-center justify-center gap-3 pt-1 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => navigate(-1)}
          >
            <IconArrowLeft className="h-4 w-4" stroke={1.75} />
            Go Back
          </Button>

          <Button
            type="button"
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => navigate('/')}
          >
            <IconLayoutDashboard className="h-4 w-4" stroke={1.75} />
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}