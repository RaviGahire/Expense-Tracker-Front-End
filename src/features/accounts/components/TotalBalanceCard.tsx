import { useMemo } from 'react';
import {
  IconWallet,
  IconBuildingBank,
  IconPigMoney,
  IconCreditCard,
  IconArrowsLeftRight,
  IconPlus,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { AccountsSummary } from '../hooks/useAccounts';

export interface TotalBalanceCardProps {
  summary: AccountsSummary;
  currency?: string;
  isLoading?: boolean;
  onOpenTransfer: () => void;
  onOpenCreate: () => void;
}

function formatBalanceCurrency(amount: number, currency: string = 'INR'): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function TotalBalanceCard({
  summary,
  currency = 'INR',
  isLoading = false,
  onOpenTransfer,
  onOpenCreate,
}: TotalBalanceCardProps) {
  const { liquidSharePct, savingsSharePct, isNegativeNet } = useMemo(() => {
    const grossAssets = Math.max(0, summary.totalAssets);
    const liquidPct =
      grossAssets > 0
        ? Math.min(100, Math.round((summary.liquidCashAndBank / grossAssets) * 100))
        : 0;
    const savingsPct =
      grossAssets > 0 ? Math.max(0, 100 - liquidPct) : 0;

    return {
      liquidSharePct: liquidPct,
      savingsSharePct: savingsPct,
      isNegativeNet: summary.combinedBalance < 0,
    };
  }, [summary.totalAssets, summary.liquidCashAndBank, summary.combinedBalance]);

  if (isLoading) {
    return (
      <Card className="animate-pulse space-y-5 bg-surface-elevated/40 p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 rounded bg-surface-elevated" />
          <div className="h-9 w-32 rounded-xl bg-surface-elevated" />
        </div>
        <div className="h-10 w-56 rounded bg-surface-elevated" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-20 rounded-xl bg-surface-elevated" />
          <div className="h-20 rounded-xl bg-surface-elevated" />
          <div className="h-20 rounded-xl bg-surface-elevated" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 border-brand/25 p-5 sm:p-6">
      {/* Top Row: Combined Net Balance & Quick Actions */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-ink-secondary uppercase">
              <IconWallet className="h-4 w-4 text-brand" stroke={1.75} />
              Combined Net Balance
            </span>
            <Badge variant={isNegativeNet ? 'expense' : 'brand'}>
              {summary.accountCount}{' '}
              {summary.accountCount === 1 ? 'Account' : 'Accounts'}
            </Badge>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <p
              className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${
                isNegativeNet ? 'text-expense' : 'text-ink-primary'
              }`}
            >
              {formatBalanceCurrency(summary.combinedBalance, currency)}
            </p>

            {summary.totalLiabilities > 0 && (
              <span className="text-xs text-ink-muted">
                (Gross Assets:{' '}
                <strong className="font-semibold text-ink-secondary">
                  {formatBalanceCurrency(summary.totalAssets, currency)}
                </strong>
                )
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            disabled={summary.accountCount < 2}
            onClick={onOpenTransfer}
          >
            <IconArrowsLeftRight className="h-4 w-4" stroke={1.75} />
            Transfer Funds
          </Button>

          <Button type="button" variant="primary" onClick={onOpenCreate}>
            <IconPlus className="h-4 w-4" stroke={2} />
            Add Account
          </Button>
        </div>
      </div>

      {/* Asset Allocation Composition Bar */}
      {summary.totalAssets > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-ink-muted">
            <span>Liquid Spending ({liquidSharePct}%)</span>
            <span>Savings Reserves ({savingsSharePct}%)</span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
            {liquidSharePct > 0 && (
              <div
                style={{ width: `${liquidSharePct}%` }}
                className="h-full bg-brand transition-all duration-300"
              />
            )}
            {savingsSharePct > 0 && (
              <div
                style={{ width: `${savingsSharePct}%` }}
                className="h-full bg-income transition-all duration-300"
              />
            )}
          </div>
        </div>
      )}

      {/* 3-Column Sub-Breakdown Strip */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {/* Liquid Cash, Bank & Wallets */}
        <div className="flex items-center gap-3 rounded-xl border border-subtle/80 bg-surface-elevated/40 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <IconBuildingBank className="h-5 w-5" stroke={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold tracking-wide text-ink-secondary uppercase">
              Cash, Bank & Wallets
            </p>
            <p className="mt-0.5 truncate text-base font-bold text-ink-primary">
              {formatBalanceCurrency(summary.liquidCashAndBank, currency)}
            </p>
          </div>
        </div>

        {/* Savings Accounts */}
        <div className="flex items-center gap-3 rounded-xl border border-subtle/80 bg-surface-elevated/40 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-income/15 text-income">
            <IconPigMoney className="h-5 w-5" stroke={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold tracking-wide text-ink-secondary uppercase">
              Savings Reserves
            </p>
            <p className="mt-0.5 truncate text-base font-bold text-income">
              {formatBalanceCurrency(summary.savingsTotal, currency)}
            </p>
          </div>
        </div>

        {/* Credit Card Liabilities */}
        <div className="flex items-center gap-3 rounded-xl border border-subtle/80 bg-surface-elevated/40 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-expense/15 text-expense">
            <IconCreditCard className="h-5 w-5" stroke={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold tracking-wide text-ink-secondary uppercase">
              Credit Card Owed
            </p>
            <p
              className={`mt-0.5 truncate text-base font-bold ${
                summary.totalLiabilities > 0 ? 'text-expense' : 'text-ink-primary'
              }`}
            >
              {formatBalanceCurrency(summary.totalLiabilities, currency)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}