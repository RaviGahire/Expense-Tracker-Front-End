export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly';

export type BudgetStatus = 'on-track' | 'warning' | 'exceeded';

export interface BudgetItem {
  id: string;
  category: string;
  limit: number;
  period: BudgetPeriod;
  month: string; // YYYY-MM format (e.g., "2026-11")
  alertThreshold: number; // Percentage (e.g., 80 means warn at 80% spent)
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetPayload {
  category: string;
  limit: number;
  period: BudgetPeriod;
  month: string;
  alertThreshold: number;
  notes?: string;
}

export interface BudgetWithProgress extends BudgetItem {
  spent: number;
  remaining: number;
  percentage: number;
  rawPercentage: number;
  status: BudgetStatus;
  transactionCount: number;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  totalCount: number;
  onTrackCount: number;
  warningCount: number;
  exceededCount: number;
}