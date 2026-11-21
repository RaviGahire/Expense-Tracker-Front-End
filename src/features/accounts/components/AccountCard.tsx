import { useMemo } from 'react';
import {
  IconArrowsLeftRight,
  IconEdit,
  IconTrash,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { CategoryIcon } from '../../categories/components/CategoryIcon';
import type { Account, AccountType } from '../types/account.types';

export interface AccountCardProps {
  account: Account;
  currency?: string;
  canTransfer?: boolean;
  isMutating?: boolean;
  onTransfer: (account: Account) => void;
  onSetDefault: (account: Account) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const ACCOUNT_TYPE_META: Record<
  AccountType,
  { label: string; badgeVariant: 'brand' | 'income' | 'expense' | 'warning' | 'neutral' }
> = {
  bank: { label: 'Bank Account', badgeVariant: 'brand' },
  savings: { label: 'Savings', badgeVariant: 'income' },
  wallet: { label: 'Digital Wallet', badgeVariant: 'warning' },
  cash: { label: 'Cash', badgeVariant: 'neutral' },
  credit_card: { label: 'Credit Card', badgeVariant: 'expense' },
};

function formatAccountCurrency(amount: number, currency: string = 'INR'): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function AccountCard({
  account,
  currency = 'INR',
  canTransfer = true,
  isMutating = false,
  onTransfer,
  onSetDefault,
  onEdit,
  onDelete,
}: AccountCardProps) {
  const isCreditCard = account.type === 'credit_card';
  const typeMeta = ACCOUNT_TYPE_META[account.type];

  const creditMetrics = useMemo(() => {
    if (!isCreditCard || !account.creditLimit || account.creditLimit <= 0) {
      return null;
    }

    const used = Math.max(0, account.balance);
    const available = Math.max(0, account.creditLimit - used);
    const utilizationPct = Math.min(
      100,
      Math.round((used / account.creditLimit) * 100)
    );

    return {
      limit: account.creditLimit,
      available,
      utilizationPct,
      isHighUtilization: utilizationPct >= 75,
    };
  }, [isCreditCard, account.balance, account.creditLimit]);

  const subtitleParts: string[] = [];
  if (account.institution) {
    subtitleParts.push(account.institution);
  }
  if (account.accountNumberLast4) {
    subtitleParts.push(`•••• ${account.accountNumberLast4}`);
  }
  const subtitle =
    subtitleParts.length > 0 ? subtitleParts.join(' • ') : typeMeta.label;

  return (
    <Card
      className={`flex flex-col justify-between gap-4 transition-all ${
        account.isDefault ? 'border-brand/40' : ''
      }`}
    >
      {/* Top Section: Icon, Name, Institution & Badges */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <CategoryIcon
              name={account.iconName}
              label={account.name}
              type={isCreditCard ? 'expense' : 'income'}
              color={account.color}
              size="md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-base font-bold text-ink-primary">
                  {account.name}
                </h3>
                {account.isDefault && (
                  <span
                    title="Default account for new transactions"
                    className="inline-flex shrink-0 items-center text-warning"
                  >
                    <IconStarFilled className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-ink-secondary">{subtitle}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant={typeMeta.badgeVariant}>{typeMeta.label}</Badge>
            {account.isDefault && (
              <span className="text-[10px] font-semibold tracking-wide text-brand uppercase">
                Default
              </span>
            )}
          </div>
        </div>

        {/* Balance Box */}
        <div className="rounded-xl border border-subtle/70 bg-surface-elevated/40 p-3.5">
          <span className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
            {isCreditCard ? 'Current Statement Balance' : 'Available Balance'}
          </span>

          <p
            className={`mt-1 text-xl font-bold tracking-tight ${
              isCreditCard
                ? account.balance > 0
                  ? 'text-expense'
                  : 'text-income'
                : account.balance < 0
                ? 'text-expense'
                : 'text-ink-primary'
            }`}
          >
            {formatAccountCurrency(account.balance, currency)}
          </p>

          {/* Optional Credit Card Utilization Bar */}
          {creditMetrics && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ink-secondary">
                  Available:{' '}
                  <strong className="font-semibold text-ink-primary">
                    {formatAccountCurrency(creditMetrics.available, currency)}
                  </strong>
                </span>
                <span
                  className={`font-semibold ${
                    creditMetrics.isHighUtilization
                      ? 'text-expense'
                      : 'text-ink-muted'
                  }`}
                >
                  {creditMetrics.utilizationPct}% of{' '}
                  {formatAccountCurrency(creditMetrics.limit, currency)}
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                <div
                  style={{ width: `${creditMetrics.utilizationPct}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    creditMetrics.isHighUtilization ? 'bg-expense' : 'bg-brand'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Optional Notes */}
        {account.notes && (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
            {account.notes}
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-2 border-t border-subtle/70 pt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isMutating || !canTransfer}
          onClick={() => onTransfer(account)}
        >
          <IconArrowsLeftRight className="h-4 w-4" stroke={1.75} />
          Transfer
        </Button>

        <div className="flex items-center gap-1">
          {!account.isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault(account)}
              disabled={isMutating}
              title="Set as default account"
              aria-label="Set as default account"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-warning disabled:opacity-50"
            >
              <IconStar className="h-4.5 w-4.5" stroke={1.75} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(account)}
            disabled={isMutating}
            title="Edit account"
            aria-label="Edit account"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-ink-primary disabled:opacity-50"
          >
            <IconEdit className="h-4.5 w-4.5" stroke={1.75} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(account)}
            disabled={isMutating}
            title="Delete account"
            aria-label="Delete account"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-secondary transition-colors hover:bg-expense/15 hover:text-expense disabled:opacity-50"
          >
            <IconTrash className="h-4.5 w-4.5" stroke={1.75} />
          </button>
        </div>
      </div>
    </Card>
  );
}