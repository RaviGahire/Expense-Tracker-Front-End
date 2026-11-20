import { useState, useEffect, useCallback, useMemo } from 'react';

import { dashboardService , type DashboardPeriod , type DashboardData } from '../services/dashoardServices';
import type { SummaryStats } from '../components/SummaryCards';
import type { BudgetItem } from '../components/BudgetProgressCard';
import type { RecentTransactionItem } from '../components/RecentTransactions';
import type { MonthlyCashflowPoint } from '../components/IncomeExpenseChart';
import type { QuickTransactionPayload } from '../components/QuickAddButton';

export type { DashboardPeriod, DashboardData };

export interface UseDashboardReturn {
  period: DashboardPeriod;
  setPeriod: (period: DashboardPeriod) => void;
  stats: SummaryStats;
  budgets: BudgetItem[];
  recentTransactions: RecentTransactionItem[];
  cashflow: MonthlyCashflowPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addQuickTransaction: (payload: QuickTransactionPayload) => Promise<void>;
}

const INITIAL_STATS: SummaryStats = {
  totalBalance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  savingsRate: 0,
};

export function useDashboard(
  initialPeriod: DashboardPeriod = 'this_month'
): UseDashboardReturn {
  const [period, setPeriod] = useState<DashboardPeriod>(initialPeriod);
  const [data, setData] = useState<DashboardData>({
    stats: INITIAL_STATS,
    budgets: [],
    recentTransactions: [],
    cashflow: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dashboardService.getDashboardData(period);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load dashboard summary. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const addQuickTransaction = useCallback(
    async (payload: QuickTransactionPayload) => {
      const createdTransaction =
        await dashboardService.createQuickTransaction(payload);

      if (dashboardService.isRemoteEnabled()) {
        await fetchDashboardData();
        return;
      }

      // Live local state synchronization when running without backend API
      setData((prev) => {
        const isIncome = payload.type === 'income';
        const nextIncome = isIncome
          ? prev.stats.monthlyIncome + payload.amount
          : prev.stats.monthlyIncome;
        const nextExpenses = !isIncome
          ? prev.stats.monthlyExpenses + payload.amount
          : prev.stats.monthlyExpenses;
        const nextBalance = isIncome
          ? prev.stats.totalBalance + payload.amount
          : prev.stats.totalBalance - payload.amount;
        const nextSavingsRate =
          nextIncome > 0
            ? Math.max(0, ((nextIncome - nextExpenses) / nextIncome) * 100)
            : 0;

        const nextBudgets = !isIncome
          ? prev.budgets.map((budget) =>
              budget.category.toLowerCase() === payload.category.toLowerCase()
                ? { ...budget, spent: budget.spent + payload.amount }
                : budget
            )
          : prev.budgets;

        const nextCashflow = prev.cashflow.map((point, idx) =>
          idx === prev.cashflow.length - 1
            ? {
                ...point,
                income: isIncome ? point.income + payload.amount : point.income,
                expense: !isIncome
                  ? point.expense + payload.amount
                  : point.expense,
              }
            : point
        );

        return {
          stats: {
            ...prev.stats,
            totalBalance: nextBalance,
            monthlyIncome: nextIncome,
            monthlyExpenses: nextExpenses,
            savingsRate: nextSavingsRate,
          },
          budgets: nextBudgets,
          recentTransactions: [createdTransaction, ...prev.recentTransactions],
          cashflow: nextCashflow,
        };
      });
    },
    [fetchDashboardData]
  );

  return useMemo(
    () => ({
      period,
      setPeriod,
      stats: data.stats,
      budgets: data.budgets,
      recentTransactions: data.recentTransactions,
      cashflow: data.cashflow,
      isLoading,
      error,
      refetch: fetchDashboardData,
      addQuickTransaction,
    }),
    [period, data, isLoading, error, fetchDashboardData, addQuickTransaction]
  );
}