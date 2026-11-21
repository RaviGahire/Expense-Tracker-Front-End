import {
  IconEdit,
  IconTrash,
  IconRepeat,
  IconCalendarEvent,
  IconPlayerPause,
  IconPlayerPlay,
  IconBolt,
  IconCreditCard,
  IconClockCheck,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useCategoriesContext } from '../../categories/context/CategoriesContext';
import { CategoryIcon } from '../../categories/components/CategoryIcon';
import { getTodayDateString } from '../services/recurringService';
import type {
  RecurringFrequency,
  RecurringRule,
} from '../types/recurring.types';

export interface RecurringRuleCardProps {
  rule: RecurringRule;
  currency?: string;
  onEdit: (rule: RecurringRule) => void;
  onDelete: (rule: RecurringRule) => void;
  onToggleStatus: (rule: RecurringRule) => void;
  onRunNow: (rule: RecurringRule) => void;
  disabled?: boolean;
}

const FREQUENCY_LABEL_MAP: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function formatRuleCurrency(
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

function formatShortDate(dateString: string): string {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function getDueBadgeInfo(rule: RecurringRule): {
  label: string;
  variant: 'income' | 'warning' | 'expense' | 'neutral' | 'brand';
} {
  if (rule.status === 'paused') {
    return { label: 'Paused', variant: 'neutral' };
  }
  if (rule.status === 'completed') {
    return { label: 'Completed', variant: 'neutral' };
  }

  const todayStr = getTodayDateString();
  const [tYear, tMonth, tDay] = rule.nextDate.split('-').map(Number);
  const [cYear, cMonth, cDay] = todayStr.split('-').map(Number);

  if (
    Number.isNaN(tYear) ||
    Number.isNaN(tMonth) ||
    Number.isNaN(tDay) ||
    Number.isNaN(cYear) ||
    Number.isNaN(cMonth) ||
    Number.isNaN(cDay)
  ) {
    return { label: 'Active', variant: 'brand' };
  }

  const targetUtc = Date.UTC(tYear, tMonth - 1, tDay);
  const currentUtc = Date.UTC(cYear, cMonth - 1, cDay);
  const diffDays = Math.round((targetUtc - currentUtc) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      label: `Overdue by ${overdueDays}d`,
      variant: 'expense',
    };
  }
  if (diffDays === 0) {
    return { label: 'Due today', variant: 'warning' };
  }
  if (diffDays === 1) {
    return { label: 'Due tomorrow', variant: 'warning' };
  }
  if (diffDays <= 7) {
    return { label: `In ${diffDays} days`, variant: 'brand' };
  }
  return { label: `In ${diffDays} days`, variant: 'income' };
}

export function RecurringRuleCard({
  rule,
  currency = 'INR',
  onEdit,
  onDelete,
  onToggleStatus,
  onRunNow,
  disabled = false,
}: RecurringRuleCardProps) {
  const { getCategoryByValue } = useCategoriesContext();

  const matchedCategory = getCategoryByValue(rule.category);
  const isIncome = rule.type === 'income';
  const isPaused = rule.status === 'paused';
  const isCompleted = rule.status === 'completed';

  const formattedAmount = formatRuleCurrency(rule.amount, currency);
  const dueBadge = getDueBadgeInfo(rule);

  return (
    <Card
      className={`flex flex-col justify-between gap-4 transition-opacity ${
        isPaused || isCompleted ? 'opacity-75' : ''
      }`}
    >
      {/* Top Row: Category Icon, Title, Category/Payment Metadata & Edit/Delete */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryIcon
            name={matchedCategory?.iconName}
            label={rule.category}
            type={rule.type}
            color={matchedCategory?.color}
            size="md"
          />

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-ink-primary sm:text-base">
              {rule.title}
            </h3>

            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-secondary">
              <span>{rule.category}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-ink-muted">
                <IconCreditCard className="h-3.5 w-3.5" stroke={1.75} />
                {rule.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Edit & Delete Icon Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Edit ${rule.title} schedule`}
            onClick={() => onEdit(rule)}
            disabled={disabled}
          >
            <IconEdit className="h-4 w-4" stroke={1.75} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete ${rule.title} schedule`}
            onClick={() => onDelete(rule)}
            disabled={disabled}
            className="text-expense hover:bg-expense/10 hover:text-expense"
          >
            <IconTrash className="h-4 w-4" stroke={1.75} />
          </Button>
        </div>
      </div>

      {/* Middle Row: Signed Recurring Amount, Frequency Badge & Due Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-subtle bg-surface-elevated/45 px-3.5 py-2.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-lg font-bold tracking-tight sm:text-xl ${
              isIncome ? 'text-income' : 'text-expense'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formattedAmount}
          </span>
          <span className="text-xs text-ink-muted">
            / {FREQUENCY_LABEL_MAP[rule.frequency].toLowerCase()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="brand"
            icon={<IconRepeat className="h-3 w-3" stroke={2} />}
          >
            {FREQUENCY_LABEL_MAP[rule.frequency]}
          </Badge>

          <Badge variant={dueBadge.variant}>{dueBadge.label}</Badge>
        </div>
      </div>

      {/* Schedule Dates & Auto-Create Indicator */}
      <div className="space-y-1.5 text-xs text-ink-secondary">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <IconCalendarEvent className="h-3.5 w-3.5 text-brand" stroke={1.75} />
            {isCompleted ? 'Ended on' : 'Next scheduled'}
          </span>
          <span className="font-semibold text-ink-primary">
            {formatShortDate(isCompleted && rule.endDate ? rule.endDate : rule.nextDate)}
          </span>
        </div>

        {rule.lastProcessedDate && (
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <IconClockCheck className="h-3.5 w-3.5 text-income" stroke={1.75} />
              Last logged
            </span>
            <span>{formatShortDate(rule.lastProcessedDate)}</span>
          </div>
        )}

        {rule.endDate && !isCompleted && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-muted">Ends on</span>
            <span>{formatShortDate(rule.endDate)}</span>
          </div>
        )}
      </div>

      {/* Optional Notes */}
      {rule.notes && (
        <p className="border-t border-subtle pt-2.5 text-xs text-ink-muted">
          {rule.notes}
        </p>
      )}

      {/* Footer Quick Controls: Pause/Resume & Run Now */}
      {!isCompleted && (
        <div className="flex items-center justify-between gap-2 border-t border-subtle pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleStatus(rule)}
            disabled={disabled}
            leftIcon={
              isPaused ? (
                <IconPlayerPlay className="h-3.5 w-3.5 text-income" stroke={2} />
              ) : (
                <IconPlayerPause className="h-3.5 w-3.5 text-warning" stroke={2} />
              )
            }
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRunNow(rule)}
            disabled={disabled || isPaused}
            leftIcon={<IconBolt className="h-3.5 w-3.5 text-brand" stroke={2} />}
          >
            Log Now
          </Button>
        </div>
      )}
    </Card>
  );
}