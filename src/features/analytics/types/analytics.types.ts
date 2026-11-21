export type AnalyticsTimeframe =
  | 'this_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'all_time';

export interface MonthlyCashflowPoint {
  monthKey: string; // YYYY-MM
  label: string; // e.g., "Nov 2026"
  shortLabel: string; // e.g., "Nov"
  income: number;
  expense: number;
  net: number;
  savingsRate: number; // percentage 0-100 (can be negative if overspent)
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  color: string;
  iconName?: string;
}

export interface PaymentMethodBreakdownItem {
  method: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  averageAmount: number;
}

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  averageDailySpend: number;
  largestExpenseTitle: string | null;
  largestExpenseAmount: number;
  transactionCount: number;
}