export type ProgressVariant = 'auto' | 'brand' | 'income' | 'warning' | 'expense';

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: ProgressVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const barColors: Record<Exclude<ProgressVariant, 'auto'>, string> = {
  brand: 'bg-brand',
  income: 'bg-income',
  warning: 'bg-warning',
  expense: 'bg-expense',
};

const trackSizes: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

export const ProgressBar =({
  value,
  max = 100,
  label,
  showPercentage = false,
  variant = 'auto',
  size = 'md',
  className = '',
}: ProgressBarProps) =>{
  const safeMax = max > 0 ? max : 100;
  const rawPercentage = (value / safeMax) * 100;
  const clampedPercentage = Math.min(100, Math.max(0, rawPercentage));

  const resolvedVariant: Exclude<ProgressVariant, 'auto'> =
    variant !== 'auto'
      ? variant
      : rawPercentage >= 100
      ? 'expense'
      : rawPercentage >= 75
      ? 'warning'
      : 'brand';

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && (
            <span className="font-medium text-ink-secondary">{label}</span>
          )}
          {showPercentage && (
            <span
              className={`font-semibold ${
                rawPercentage >= 100 ? 'text-expense' : 'text-ink-primary'
              }`}
            >
              {Math.round(rawPercentage)}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label || 'Progress'}
        className={`w-full overflow-hidden rounded-full bg-surface-elevated ${trackSizes[size]}`}
      >
        <div
          style={{ width: `${clampedPercentage}%` }}
          className={`h-full rounded-full transition-all duration-300 ${barColors[resolvedVariant]}`}
        />
      </div>
    </div>
  );
}