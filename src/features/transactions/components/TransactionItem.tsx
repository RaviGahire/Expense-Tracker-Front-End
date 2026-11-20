import type { ReactNode } from 'react';
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconEdit,
  IconTrash,
  IconRepeat,
  IconPaperclip,
  IconToolsKitchen2 ,
  IconHome,
  IconCar,
  IconShoppingBag,
  IconBolt,
  IconBriefcase,
  IconDeviceLaptop,
  IconHeartbeat,
  IconBook,
  IconGift,
  IconCategory,
} from '@tabler/icons-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { TransactionFormType } from './TransactionForm';
import type { RecurringConfig } from './RecurringFields';
import type { ExistingAttachment } from './AttachmentUpload';

export interface TransactionRecord {
  id: string;
  title: string;
  amount: number;
  type: TransactionFormType;
  category: string;
  paymentMethod: string;
  date: string;
  notes?: string;
  recurring?: RecurringConfig;
  existingAttachment?: ExistingAttachment | null;
}

export interface TransactionItemProps {
  transaction: TransactionRecord;
  currency?: string;
  variant?: 'table-row' | 'mobile-card';
  onEdit: (transaction: TransactionRecord) => void;
  onDelete: (transaction: TransactionRecord) => void;
}

export function formatTransactionCurrency(
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

export function formatTransactionDate(dateString: string): string {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function getCategoryVisual(
  category: string,
  type: TransactionFormType
): { icon: ReactNode; badgeClass: string } {
  const normalized = category.trim().toLowerCase();

  if (type === 'income') {
    if (normalized.includes('salary') || normalized.includes('job')) {
      return {
        icon: <IconBriefcase className="h-4 w-4" stroke={1.75} />,
        badgeClass: 'bg-income/15 text-income',
      };
    }
    if (normalized.includes('freelance') || normalized.includes('client')) {
      return {
        icon: <IconDeviceLaptop className="h-4 w-4" stroke={1.75} />,
        badgeClass: 'bg-income/15 text-income',
      };
    }
    if (normalized.includes('bonus') || normalized.includes('gift')) {
      return {
        icon: <IconGift className="h-4 w-4" stroke={1.75} />,
        badgeClass: 'bg-income/15 text-income',
      };
    }
    return {
      icon: <IconArrowUpRight className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-income/15 text-income',
    };
  }

  if (normalized.includes('food') || normalized.includes('dining')) {
    return {
      icon: <IconToolsKitchen2  className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-warning/15 text-warning',
    };
  }
  if (normalized.includes('rent') || normalized.includes('housing')) {
    return {
      icon: <IconHome className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-brand/15 text-brand',
    };
  }
  if (
    normalized.includes('transport') ||
    normalized.includes('travel') ||
    normalized.includes('fuel')
  ) {
    return {
      icon: <IconCar className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-accent/15 text-accent',
    };
  }
  if (normalized.includes('shop')) {
    return {
      icon: <IconShoppingBag className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-expense/15 text-expense',
    };
  }
  if (normalized.includes('bill') || normalized.includes('utilit')) {
    return {
      icon: <IconBolt className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-warning/15 text-warning',
    };
  }
  if (normalized.includes('health') || normalized.includes('medical')) {
    return {
      icon: <IconHeartbeat className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-expense/15 text-expense',
    };
  }
  if (normalized.includes('educat') || normalized.includes('course')) {
    return {
      icon: <IconBook className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-accent/15 text-accent',
    };
  }

  return {
    icon: <IconCategory className="h-4 w-4" stroke={1.75} />,
    badgeClass: 'bg-surface-elevated text-ink-secondary',
  };
}

export function TransactionItem({
  transaction,
  currency = 'INR',
  variant = 'table-row',
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const visual = getCategoryVisual(transaction.category, transaction.type);
  const formattedAmount = formatTransactionCurrency(transaction.amount, currency);
  const formattedDate = formatTransactionDate(transaction.date);

  if (variant === 'mobile-card') {
    return (
      <div className="space-y-3 p-4 transition-colors hover:bg-surface-elevated/30">
        {/* Top Row: Category Icon, Title, Date & Signed Amount */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.badgeClass}`}
            >
              {visual.icon}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-primary">
                {transaction.title}
              </p>
              <p className="mt-0.5 text-xs text-ink-secondary">
                {transaction.category} • {formattedDate}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 text-sm font-bold tracking-tight ${
              isIncome ? 'text-income' : 'text-expense'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formattedAmount}
          </span>
        </div>

        {/* Optional Notes */}
        {transaction.notes && (
          <p className="text-xs text-ink-muted">{transaction.notes}</p>
        )}

        {/* Bottom Row: Payment Method, Recurring/Attachment Badges & Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="neutral">{transaction.paymentMethod}</Badge>

            {transaction.recurring?.isRecurring && (
              <Badge
                variant="brand"
                icon={<IconRepeat className="h-3 w-3" stroke={2} />}
              >
                {transaction.recurring.frequency}
              </Badge>
            )}

            {transaction.existingAttachment?.url && (
              <a
                href={transaction.existingAttachment.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`View receipt: ${transaction.existingAttachment.name}`}
                aria-label={`View receipt for ${transaction.title}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-subtle bg-surface-elevated text-ink-secondary transition-colors hover:text-brand"
              >
                <IconPaperclip className="h-3.5 w-3.5" stroke={2} />
              </a>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Edit ${transaction.title}`}
              onClick={() => onEdit(transaction)}
            >
              <IconEdit className="h-4 w-4" stroke={1.75} />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Delete ${transaction.title}`}
              onClick={() => onDelete(transaction)}
              className="text-expense hover:bg-expense/10 hover:text-expense"
            >
              <IconTrash className="h-4 w-4" stroke={1.75} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* Default: Desktop Table Row */
  return (
    <tr className="transition-colors hover:bg-surface-elevated/40">
      {/* Title + Notes + Recurring/Attachment Indicators */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.badgeClass}`}
          >
            {visual.icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-ink-primary">
                {transaction.title}
              </span>

              {transaction.recurring?.isRecurring && (
                <Badge
                  variant="brand"
                  icon={<IconRepeat className="h-3 w-3" stroke={2} />}
                >
                  {transaction.recurring.frequency}
                </Badge>
              )}

              {transaction.existingAttachment?.url && (
                <a
                  href={transaction.existingAttachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`View receipt: ${transaction.existingAttachment.name}`}
                  aria-label={`View receipt for ${transaction.title}`}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-surface-elevated text-ink-secondary transition-colors hover:text-brand"
                >
                  <IconPaperclip className="h-3.5 w-3.5" stroke={2} />
                </a>
              )}
            </div>

            {transaction.notes && (
              <p className="mt-0.5 max-w-xs truncate text-xs text-ink-muted">
                {transaction.notes}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-4">
        <Badge variant="neutral">{transaction.category}</Badge>
      </td>

      {/* Date */}
      <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-ink-secondary">
        {formattedDate}
      </td>

      {/* Payment Method */}
      <td className="px-4 py-4 whitespace-nowrap text-xs text-ink-muted">
        {transaction.paymentMethod}
      </td>

      {/* Signed Amount + Type Badge */}
      <td className="px-4 py-4 text-right whitespace-nowrap">
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-sm font-bold tracking-tight ${
              isIncome ? 'text-income' : 'text-expense'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formattedAmount}
          </span>

          <Badge
            variant={isIncome ? 'income' : 'expense'}
            icon={
              isIncome ? (
                <IconArrowUpRight className="h-3 w-3" stroke={2} />
              ) : (
                <IconArrowDownRight className="h-3 w-3" stroke={2} />
              )
            }
          >
            {isIncome ? 'Income' : 'Expense'}
          </Badge>
        </div>
      </td>

      {/* Edit / Delete Actions */}
      <td className="px-6 py-4 text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Edit ${transaction.title}`}
            onClick={() => onEdit(transaction)}
          >
            <IconEdit className="h-4 w-4" stroke={1.75} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete ${transaction.title}`}
            onClick={() => onDelete(transaction)}
            className="text-expense hover:bg-expense/10 hover:text-expense"
          >
            <IconTrash className="h-4 w-4" stroke={1.75} />
          </Button>
        </div>
      </td>
    </tr>
  );
}