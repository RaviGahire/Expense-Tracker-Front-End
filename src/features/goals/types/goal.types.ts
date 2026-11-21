import type { CategoryColorToken } from '../../categories/components/CategoryIcon';

export type GoalStatus = 'active' | 'completed' | 'paused';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface GoalContributionEntry {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // YYYY-MM-DD
  priority: GoalPriority;
  status: GoalStatus;
  color: CategoryColorToken;
  iconName?: string;
  notes?: string;
  contributions: GoalContributionEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GoalPayload {
  title: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  priority: GoalPriority;
  status?: GoalStatus;
  color: CategoryColorToken;
  iconName?: string;
  notes?: string;
}

export interface ContributionPayload {
  amount: number;
  date: string;
  note?: string;
  recordAsTransaction?: boolean;
}