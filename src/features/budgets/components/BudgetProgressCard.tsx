import {
  IconEdit,
  IconTrash,
  IconAlertTriangle,
  IconCircleCheck,
  IconExclamationCircle,
  IconReceipt,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useCategoriesContext } from '../../categories/context/CategoriesContext';
import { CategoryIcon } from '../../categories/components/CategoryIcon';
import type {
  BudgetPeriod,
  BudgetStatus,
  BudgetWithProgress,
} from '../types/budget.types';

export interface BudgetProgressCardProps {
  budget: BudgetWithProgress;
  currency?: string;
  onEdit: (budget: BudgetWithProgress) => void;
  onDelete: (budget: BudgetWithProgress) => void;
  disabled?: boolean;
}

interface StatusVisualConfig {
  label: string;
  badgeVariant: 'income' | 'warning' | 'expense';
  barFillClass: string;
  accentTextClass: string;
  borderHighlightClass: string;
}

const STATUS_VISUAL_MAP: Record<BudgetStatus, StatusVisualConfig> = {
  'on-track': {
    label: 'On Track',
    badgeVariant: 'income',
    barFillClass: 'bg-income',
    accentTextClass: 'text-income',
    borderHighlightClass: '',
  },
  warning: {
    label: 'Near Limit',
    badgeVariant: 'warning',
    barFillClass: 'bg-warning',
    accentTextClass: 'text-warning',
    borderHighlightClass: 'border-warning/35',
  },
  exceeded: {
    label: 'Exceeded',
    badgeVariant: 'expense',
    barFillClass: 'bg-expense',
    accentTextClass: 'text-expense',
    borderHighlightClass: 'border-expense/40',
  },
};

const PERIOD_LABEL_MAP: Record<BudgetPeriod, string> = {
  monthly: 'Monthly',
  weekly: 'Weekly',
  yearly: 'Yearly',
};

function formatBudgetCurrency(
  amount: number,
  currency: string = 'INR'
): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function BudgetProgressCard({
  budget,
  currency = 'INR',
  onEdit,
  onDelete,
  disabled = false,
}: BudgetProgressCardProps) {
  const { getCategoryByValue } = useCategoriesContext();

  const matchedCategory = getCategoryByValue(budget.category);
  const statusConfig = STATUS_VISUAL_MAP[budget.status];
  const isExceeded = budget.remaining < 0;

  const formattedSpent = formatBudgetCurrency(budget.spent, currency);
  const formattedLimit = formatBudgetCurrency(budget.limit, currency);
  const formattedDelta = formatBudgetCurrency(
    Math.abs(budget.remaining),
    currency
  );

  const clampedThreshold = Math.min(
    100,
    Math.max(50, budget.alertThreshold || 80)
  );

  const renderStatusIcon = () => {
    if (budget.status === 'exceeded') {
      return <IconExclamationCircle className="h-3.5 w-3.5" stroke={2} />;
    }
    if (budget.status === 'warning') {
      return <IconAlertTriangle className="h-3.5 w-3.5" stroke={2} />;
    }
    return <IconCircleCheck className="h-3.5 w-3.5" stroke={2} />;
  };

  return (
    <Card
      className={`flex flex-col justify-between gap-4 transition-colors ${statusConfig.borderHighlightClass}`}
    >
      {/* Top Row: Category Icon, Name, Period & Edit/Delete Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryIcon
            name={matchedCategory?.iconName}
            label={budget.category}
            type="expense"
            color={matchedCategory?.color}
            size="md"
          />

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-ink-primary sm:text-base">
              {budget.category}
            </h3>

            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span>{PERIOD_LABEL_MAP[budget.period]} limit</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <IconReceipt className="h-3.5 w-3.5" stroke={1.75} />
                {budget.transactionCount}{' '}
                {budget.transactionCount === 1 ? 'expense' : 'expenses'}
              </span>
            </div>
          </div>
        </div>

        {/* Card Action Buttons */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Edit ${budget.category} budget`}
            onClick={() => onEdit(budget)}
            disabled={disabled}
          >
            <IconEdit className="h-4 w-4" stroke={1.75} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete ${budget.category} budget`}
            onClick={() => onDelete(budget)}
            disabled={disabled}
            className="text-expense hover:bg-expense/10 hover:text-expense"
          >
            <IconTrash className="h-4 w-4" stroke={1.75} />
          </Button>
        </div>
      </div>

      {/* Middle Row: Spent vs. Limit Figures & Status Badge */}
      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-lg font-bold tracking-tight text-ink-primary sm:text-xl">
              {formattedSpent}
            </span>
            <span className="ml-1.5 text-xs font-medium text-ink-secondary">
              of {formattedLimit}
            </span>
          </div>

          <Badge variant={statusConfig.badgeVariant} icon={renderStatusIcon()}>
            {statusConfig.label} ({budget.rawPercentage}%)
          </Badge>
        </div>

        {/* Progress Bar Track with Alert Threshold Marker */}
        <div className="relative">
          <div
            role="progressbar"
            aria-label={`${budget.category} budget usage`}
            aria-valuenow={Math.round(budget.rawPercentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2.5 w-full overflow-hidden rounded-full bg-surface-elevated"
          >
            <div
              style={{ width: `${budget.percentage}%` }}
              className={`h-full rounded-full transition-all duration-300 ${statusConfig.barFillClass}`}
            />
          </div>

          {/* Subtle Threshold Tick Mark */}
          {clampedThreshold < 100 && (
            <div
              title={`Alert threshold: ${clampedThreshold}%`}
              style={{ left: `${clampedThreshold}%` }}
              className="pointer-events-none absolute -top-0.5 h-3.5 w-0.5 -translate-x-1/2 rounded-full bg-ink-muted/60"
            />
          )}
        </div>

        {/* Remaining / Overspent Footer Caption */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span
            className={`font-semibold ${
              isExceeded ? 'text-expense' : 'text-ink-secondary'
            }`}
          >
            {isExceeded
              ? `Over budget by ${formattedDelta}`
              : `${formattedDelta} remaining`}
          </span>

          <span className="text-ink-muted">
            Alert at {clampedThreshold}%
          </span>
        </div>
      </div>

      {/* Optional Notes Footer */}
      {budget.notes && (
        <p className="border-t border-subtle pt-2.5 text-xs text-ink-muted">
          {budget.notes}
        </p>
      )}
    </Card>
  );
}