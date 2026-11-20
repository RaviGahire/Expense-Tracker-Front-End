import { useState, type ChangeEvent } from 'react';
import { IconCalendarStats } from '@tabler/icons-react';
import { useAuth } from '../../auth/hooks/useAuth';

import { useDashboard , type DashboardPeriod } from '../hooks/useDashboard';
import { SummaryCards } from '../components/SummaryCards';
import { IncomeExpenseChart } from '../components/IncomeExpenseChart';
import { BudgetProgressCard } from '../components/BudgetProgressCard';
import { RecentTransactions } from '../components/RecentTransactions';
import { QuickAddButton } from '../components/QuickAddButton';
import { SelectInput } from '../../../components/ui/SelectInput';
import { ErrorState } from '../../../components/feedback/ErrorState';

const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_year', label: 'This Year' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const {
    period,
    setPeriod,
    stats,
    budgets,
    recentTransactions,
    cashflow,
    isLoading,
    error,
    refetch,
    addQuickTransaction,
  } = useDashboard('this_month');

  const [isRetrying, setIsRetrying] = useState(false);

  const handlePeriodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value as DashboardPeriod);
  };

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      await refetch();
    } finally {
      setIsRetrying(false);
    }
  };

  const firstName = user?.name?.trim().split(' ')[0] || 'there';

  return (
    <section className="space-y-6">
      {/* Top Page Header & Action Toolbar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Here is your financial overview, budget health, and recent activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-44">
            <SelectInput
              aria-label="Select dashboard period"
              value={period}
              onChange={handlePeriodChange}
              options={PERIOD_OPTIONS}
              disabled={isLoading}
              leftIcon={<IconCalendarStats className="h-4 w-4" stroke={1.75} />}
            />
          </div>

          <QuickAddButton
            currency={currency}
            onAddTransaction={addQuickTransaction}
          />
        </div>
      </div>

      {/* Error Recovery State vs. Active Dashboard Grid */}
      {error ? (
        <ErrorState
          title="Unable to load dashboard"
          message={error}
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      ) : (
        <>
          {/* Row 1: 4-Column KPI Summary Cards */}
          <SummaryCards
            stats={stats}
            currency={currency}
            isLoading={isLoading}
          />

          {/* Row 2: Cashflow Chart (7 cols) + Monthly Budget Progress (5 cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <IncomeExpenseChart
                data={cashflow}
                currency={currency}
                isLoading={isLoading}
              />
            </div>

            <div className="lg:col-span-5">
              <BudgetProgressCard
                budgets={budgets}
                currency={currency}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Row 3: Full-Width Recent Transactions Feed */}
          <RecentTransactions
            transactions={recentTransactions}
            currency={currency}
            isLoading={isLoading}
          />
        </>
      )}
    </section>
  );
}