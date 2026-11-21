import type { TransactionFormType } from '../../transactions/components/TransactionForm';

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly';

export type RecurringRuleStatus = 'active' | 'paused' | 'completed';

export interface RecurringRule {
  id: string;
  title: string;
  amount: number;
  type: TransactionFormType;
  category: string;
  paymentMethod: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  nextDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (optional)
  lastProcessedDate?: string; // YYYY-MM-DD
  status: RecurringRuleStatus;
  autoCreate: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurringPayload {
  title: string;
  amount: number;
  type: TransactionFormType;
  category: string;
  paymentMethod: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDate: string;
  endDate?: string;
  status?: RecurringRuleStatus;
  autoCreate: boolean;
  notes?: string;
}

export interface RecurringSummary {
  totalRules: number;
  activeCount: number;
  pausedCount: number;
  dueSoonCount: number;
  monthlyExpenseCommitment: number;
  monthlyIncomeCommitment: number;
  netMonthlyRecurring: number;
}