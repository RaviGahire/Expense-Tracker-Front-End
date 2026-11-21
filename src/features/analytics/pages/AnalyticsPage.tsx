import {
  IconDownload,
  IconTrendingUp,
  IconTrendingDown,
  IconPigMoney,
  IconFlame,
  IconAlertCircle,
  IconRefresh,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAnalytics } from '../hooks/useAnalytics';
import { CashflowTrendChart } from '../components/CashflowTrendChart';
import { CategoryBreakdownCard } from '../components/CategoryBreakdownCard';
import { PaymentMethodCard } from '../components/PaymentMethodCard';
import type { AnalyticsTimeframe } from '../types/analytics.types';

const TIMEFRAME_OPTIONS: { value: AnalyticsTimeframe; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: '3 Months' },
  { value: 'last_6_months', label: '6 Months' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
];

function formatAnalyticsCurrency(
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

export function AnalyticsPage() {
  const currency = 'INR';

  const {
    timeframe,
    setTimeframe,
    breakdownType,
    setBreakdownType,
    scopedTransactions,
    summary,
    cashflowSeries,
    categoryBreakdown,
    paymentMethodBreakdown,
    isLoading,
    error,
    refetch,
    exportReportCsv,
  } = useAnalytics('last_6_months');

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header & Controls */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
            Financial Analytics
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Track cash-flow trends, category distribution, and payment habits across{' '}
            <span className="font-semibold text-ink-primary">
              {summary.transactionCount}
            </span>{' '}
            {summary.transactionCount === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Pill Switcher */}
          <div
            role="group"
            aria-label="Analytics reporting timeframe"
            className="inline-flex flex-wrap rounded-xl border border-subtle bg-surface-elevated/60 p-1"
          >
            {TIMEFRAME_OPTIONS.map((option) => {
              const isActive = timeframe === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTimeframe(option.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand text-white shadow-xs'
                      : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={exportReportCsv}
            disabled={isLoading || scopedTransactions.length === 0}
          >
            <IconDownload className="h-4 w-4" stroke={1.75} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="flex flex-col items-start justify-between gap-3 border-expense/40 bg-expense/10 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5 text-sm text-expense">
            <IconAlertCircle className="h-5 w-5 shrink-0" stroke={1.75} />
            <span>{error}</span>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={refetch}>
            <IconRefresh className="h-4 w-4" stroke={1.75} />
            Retry
          </Button>
        </Card>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="h-28 animate-pulse bg-surface-elevated/40">
                <div className="h-4 w-24 rounded bg-surface-elevated" />
                <div className="mt-4 h-7 w-32 rounded bg-surface-elevated" />
              </Card>
            ))}
          </div>
          <Card className="h-72 animate-pulse bg-surface-elevated/40" />
        </div>
      ) : (
        <>
          {/* 4-Card KPI Summary Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Total Income */}
            <Card className="flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-ink-secondary uppercase">
                  Total Income
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-income/15 text-income">
                  <IconTrendingUp className="h-4.5 w-4.5" stroke={1.75} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-income">
                  +{formatAnalyticsCurrency(summary.totalIncome, currency)}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Inflows in selected period
                </p>
              </div>
            </Card>

            {/* Total Expenses */}
            <Card className="flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-ink-secondary uppercase">
                  Total Expenses
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-expense/15 text-expense">
                  <IconTrendingDown className="h-4.5 w-4.5" stroke={1.75} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-expense">
                  -{formatAnalyticsCurrency(summary.totalExpense, currency)}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Outflows in selected period
                </p>
              </div>
            </Card>

            {/* Net Savings & Rate */}
            <Card className="flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-ink-secondary uppercase">
                  Net Cash Flow
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand">
                  <IconPigMoney className="h-4.5 w-4.5" stroke={1.75} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-2xl font-bold tracking-tight ${
                      summary.netSavings >= 0 ? 'text-ink-primary' : 'text-expense'
                    }`}
                  >
                    {summary.netSavings >= 0 ? '+' : '-'}
                    {formatAnalyticsCurrency(summary.netSavings, currency)}
                  </p>
                  {summary.totalIncome > 0 && (
                    <Badge
                      variant={
                        summary.savingsRate >= 20
                          ? 'income'
                          : summary.savingsRate >= 0
                          ? 'neutral'
                          : 'expense'
                      }
                    >
                      {summary.savingsRate}% saved
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Income minus total expenses
                </p>
              </div>
            </Card>

            {/* Daily Spend & Peak Expense */}
            <Card className="flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-ink-secondary uppercase">
                  Avg. Daily Spend
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
                  <IconFlame className="h-4.5 w-4.5" stroke={1.75} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-ink-primary">
                  {formatAnalyticsCurrency(summary.averageDailySpend, currency)}
                  <span className="text-xs font-medium text-ink-muted"> / day</span>
                </p>
                <p className="mt-1 truncate text-xs text-ink-muted">
                  {summary.largestExpenseTitle
                    ? `Peak: ${summary.largestExpenseTitle} (${formatAnalyticsCurrency(
                        summary.largestExpenseAmount,
                        currency
                      )})`
                    : 'No expenses recorded yet'}
                </p>
              </div>
            </Card>
          </div>

          {/* Monthly Income vs Expense Cash-Flow Chart */}
          <CashflowTrendChart data={cashflowSeries} currency={currency} />

          {/* Bottom Split: Category Breakdown + Payment Method Distribution */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <CategoryBreakdownCard
                items={categoryBreakdown}
                type={breakdownType}
                onTypeChange={setBreakdownType}
                currency={currency}
              />
            </div>

            <div className="xl:col-span-5">
              <PaymentMethodCard
                items={paymentMethodBreakdown}
                currency={currency}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}