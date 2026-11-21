import type { ComponentType } from 'react';
import {
  IconCreditCard,
  IconDeviceMobile,
  IconBuildingBank,
  IconCash,
  IconWallet,
  IconArrowsLeftRight,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import type { PaymentMethodBreakdownItem } from '../types/analytics.types';

export interface PaymentMethodCardProps {
  items: PaymentMethodBreakdownItem[];
  currency?: string;
}

interface MethodVisualStyle {
  icon: ComponentType<{ className?: string; stroke?: number }>;
  badgeClass: string;
  barClass: string;
}

function resolveMethodVisual(method: string): MethodVisualStyle {
  const normalized = method.trim().toLowerCase();

  if (normalized.includes('upi') || normalized.includes('mobile')) {
    return {
      icon: IconDeviceMobile,
      badgeClass: 'bg-brand/15 text-brand',
      barClass: 'bg-brand',
    };
  }

  if (normalized.includes('credit') || normalized.includes('debit') || normalized.includes('card')) {
    return {
      icon: IconCreditCard,
      badgeClass: 'bg-info/15 text-info',
      barClass: 'bg-info',
    };
  }

  if (normalized.includes('bank') || normalized.includes('transfer') || normalized.includes('neft')) {
    return {
      icon: IconBuildingBank,
      badgeClass: 'bg-income/15 text-income',
      barClass: 'bg-income',
    };
  }

  if (normalized.includes('cash')) {
    return {
      icon: IconCash,
      badgeClass: 'bg-warning/15 text-warning',
      barClass: 'bg-warning',
    };
  }

  return {
    icon: IconWallet,
    badgeClass: 'bg-surface-elevated text-ink-secondary',
    barClass: 'bg-brand',
  };
}

function formatMethodCurrency(
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

export function PaymentMethodCard({
  items,
  currency = 'INR',
}: PaymentMethodCardProps) {
  const topMethod = items.length > 0 ? items[0] : null;

  return (
    <Card className="flex flex-col justify-between gap-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <IconArrowsLeftRight className="h-5 w-5" stroke={1.75} />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink-primary">
              Spending by Payment Method
            </h2>
            <p className="text-xs text-ink-secondary">
              Channel distribution and average ticket size across expenses
            </p>
          </div>
        </div>

        {topMethod && (
          <Badge variant="neutral">
            Top: {topMethod.method} ({topMethod.percentage}%)
          </Badge>
        )}
      </div>

      {/* Empty State vs. Payment Method List */}
      {items.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-surface-elevated/25 px-4 text-center">
          <p className="text-sm font-semibold text-ink-primary">
            No expense payment data yet
          </p>
          <p className="mt-1 max-w-sm text-xs text-ink-muted">
            Record expenses across UPI, cards, bank transfers, or cash to compare channel usage.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const visual = resolveMethodVisual(item.method);
            const MethodIcon = visual.icon;

            return (
              <div
                key={item.method}
                className="rounded-xl border border-subtle/70 bg-surface-elevated/35 p-3.5 transition-colors hover:bg-surface-elevated/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${visual.badgeClass}`}
                    >
                      <MethodIcon className="h-4.5 w-4.5" stroke={1.75} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink-primary">
                        {item.method}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {item.transactionCount}{' '}
                        {item.transactionCount === 1 ? 'tx' : 'txs'} • Avg{' '}
                        <span className="font-medium text-ink-secondary">
                          {formatMethodCurrency(item.averageAmount, currency)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-ink-primary">
                      {formatMethodCurrency(item.amount, currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-ink-secondary">
                      {item.percentage}%
                    </p>
                  </div>
                </div>

                {/* Share Progress Bar */}
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(3, item.percentage))}%`,
                    }}
                    className={`h-full rounded-full transition-all duration-300 ${visual.barClass}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}