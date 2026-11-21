import { useState, useMemo, useCallback } from 'react';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import { useCategoriesContext } from '../../categories/context/CategoriesContext';
import {
  buildAnalyticsSummary,
  buildCategoryBreakdown,
  buildMonthlyCashflowSeries,
  buildPaymentMethodBreakdown,
  exportTransactionsToCsv,
  filterTransactionsByTimeframe,
} from '../utils/analyticsHelpers';
import type {
  AnalyticsSummary,
  AnalyticsTimeframe,
  CategoryBreakdownItem,
  MonthlyCashflowPoint,
  PaymentMethodBreakdownItem,
} from '../types/analytics.types';
import type { TransactionRecord } from '../../transactions/components/TransactionItem';

export interface UseAnalyticsReturn {
  timeframe: AnalyticsTimeframe;
  setTimeframe: (nextTimeframe: AnalyticsTimeframe) => void;
  breakdownType: 'expense' | 'income';
  setBreakdownType: (nextType: 'expense' | 'income') => void;
  scopedTransactions: TransactionRecord[];
  summary: AnalyticsSummary;
  cashflowSeries: MonthlyCashflowPoint[];
  categoryBreakdown: CategoryBreakdownItem[];
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  exportReportCsv: () => void;
}

function getTodayStamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useAnalytics(
  initialTimeframe: AnalyticsTimeframe = 'last_6_months'
): UseAnalyticsReturn {
  const { transactions, isLoading, error, refetch } = useTransactions();
  const { getCategoryByValue } = useCategoriesContext();

  const [timeframe, setTimeframe] =
    useState<AnalyticsTimeframe>(initialTimeframe);
  const [breakdownType, setBreakdownType] = useState<'expense' | 'income'>(
    'expense'
  );

  // Filter all transactions down to the selected reporting window
  const scopedTransactions = useMemo<TransactionRecord[]>(
    () => filterTransactionsByTimeframe(transactions, timeframe),
    [transactions, timeframe]
  );

  // Top-level KPI metrics for the selected window
  const summary = useMemo<AnalyticsSummary>(
    () => buildAnalyticsSummary(scopedTransactions, timeframe),
    [scopedTransactions, timeframe]
  );

  // Month-by-month Income vs. Expense cashflow series
  const cashflowSeries = useMemo<MonthlyCashflowPoint[]>(
    () => buildMonthlyCashflowSeries(scopedTransactions, timeframe),
    [scopedTransactions, timeframe]
  );

  // Category share breakdown resolved with user's custom icons & colors
  const categoryBreakdown = useMemo<CategoryBreakdownItem[]>(
    () =>
      buildCategoryBreakdown(
        scopedTransactions,
        breakdownType,
        (categoryName) => {
          const matched = getCategoryByValue(categoryName);
          if (!matched) return undefined;
          return {
            color: matched.color,
            iconName: matched.iconName,
          };
        }
      ),
    [scopedTransactions, breakdownType, getCategoryByValue]
  );

  // Expense distribution across payment channels (UPI, Card, Bank Transfer, etc.)
  const paymentMethodBreakdown = useMemo<PaymentMethodBreakdownItem[]>(
    () => buildPaymentMethodBreakdown(scopedTransactions),
    [scopedTransactions]
  );

  const exportReportCsv = useCallback(() => {
    const filename = `fintrack-report-${timeframe}-${getTodayStamp()}.csv`;
    exportTransactionsToCsv(scopedTransactions, filename);
  }, [scopedTransactions, timeframe]);

  return {
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
  };
}