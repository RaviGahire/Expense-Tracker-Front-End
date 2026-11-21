import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  budgetService,
  getCurrentMonthString,
} from '../services/budgetService';
import type {
  BudgetItem,
  BudgetPayload,
  BudgetStatus,
  BudgetSummary,
  BudgetWithProgress,
} from '../types/budget.types';
import type { TransactionRecord } from '../../transactions/components/TransactionItem';

export interface UseBudgetsOptions {
  initialMonth?: string;
  transactions?: TransactionRecord[];
}

export interface UseBudgetsReturn {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  budgets: BudgetItem[];
  budgetsWithProgress: BudgetWithProgress[];
  summary: BudgetSummary;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createBudget: (payload: BudgetPayload) => Promise<BudgetItem>;
  updateBudget: (id: string, payload: BudgetPayload) => Promise<BudgetItem>;
  deleteBudget: (id: string) => Promise<void>;
  copyFromPreviousMonth: () => Promise<BudgetItem[]>;
}

function resolveBudgetStatus(
  rawPercentage: number,
  alertThreshold: number
): BudgetStatus {
  if (rawPercentage >= 100) return 'exceeded';
  if (rawPercentage >= alertThreshold) return 'warning';
  return 'on-track';
}

export function useBudgets({
  initialMonth,
  transactions = [],
}: UseBudgetsOptions = {}): UseBudgetsReturn {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    () => initialMonth ?? getCurrentMonthString()
  );
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await budgetService.getAll(selectedMonth);
      setBudgets(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load budgets. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Aggregate expense spending & transaction counts per category for selectedMonth
  const categorySpendingMap = useMemo(() => {
    const map = new Map<string, { spent: number; count: number }>();

    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      if (!tx.date || !tx.date.startsWith(selectedMonth)) continue;

      const key = tx.category.trim().toLowerCase();
      const current = map.get(key) ?? { spent: 0, count: 0 };
      map.set(key, {
        spent: current.spent + Math.abs(Number(tx.amount) || 0),
        count: current.count + 1,
      });
    }

    return map;
  }, [transactions, selectedMonth]);

  // Combine each budget with live spending progress & alert status
  const budgetsWithProgress = useMemo<BudgetWithProgress[]>(() => {
    const enriched = budgets.map((budget) => {
      const key = budget.category.trim().toLowerCase();
      const stats = categorySpendingMap.get(key) ?? { spent: 0, count: 0 };
      const limit = Math.max(0, Number(budget.limit) || 0);
      const spent = stats.spent;
      const remaining = limit - spent;
      const rawPercentage =
        limit > 0 ? Math.round((spent / limit) * 1000) / 10 : 0;
      const percentage = Math.min(100, Math.max(0, rawPercentage));
      const status = resolveBudgetStatus(
        rawPercentage,
        budget.alertThreshold || 80
      );

      return {
        ...budget,
        spent,
        remaining,
        percentage,
        rawPercentage,
        status,
        transactionCount: stats.count,
      };
    });

    // Prioritize exceeded and near-limit budgets at the top, then by utilization %
    const statusPriority: Record<BudgetStatus, number> = {
      exceeded: 0,
      warning: 1,
      'on-track': 2,
    };

    return enriched.sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return b.rawPercentage - a.rawPercentage;
    });
  }, [budgets, categorySpendingMap]);

  // Overall KPI metrics for the selected month
  const summary = useMemo<BudgetSummary>(() => {
    let totalBudgeted = 0;
    let totalSpent = 0;
    let onTrackCount = 0;
    let warningCount = 0;
    let exceededCount = 0;

    for (const item of budgetsWithProgress) {
      totalBudgeted += item.limit;
      totalSpent += item.spent;

      if (item.status === 'exceeded') {
        exceededCount += 1;
      } else if (item.status === 'warning') {
        warningCount += 1;
      } else {
        onTrackCount += 1;
      }
    }

    const totalRemaining = totalBudgeted - totalSpent;
    const overallPercentage =
      totalBudgeted > 0
        ? Math.round((totalSpent / totalBudgeted) * 1000) / 10
        : 0;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overallPercentage,
      totalCount: budgetsWithProgress.length,
      onTrackCount,
      warningCount,
      exceededCount,
    };
  }, [budgetsWithProgress]);

  const createBudget = useCallback(
    async (payload: BudgetPayload): Promise<BudgetItem> => {
      try {
        setIsMutating(true);
        const created = await budgetService.create(payload);
        if (created.month === selectedMonth) {
          setBudgets((prev) => [created, ...prev]);
        }
        return created;
      } finally {
        setIsMutating(false);
      }
    },
    [selectedMonth]
  );

  const updateBudget = useCallback(
    async (id: string, payload: BudgetPayload): Promise<BudgetItem> => {
      try {
        setIsMutating(true);
        const updated = await budgetService.update(id, payload);
        setBudgets((prev) => {
          if (updated.month !== selectedMonth) {
            return prev.filter((item) => item.id !== id);
          }
          return prev.map((item) => (item.id === id ? updated : item));
        });
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [selectedMonth]
  );

  const deleteBudget = useCallback(async (id: string): Promise<void> => {
    try {
      setIsMutating(true);
      await budgetService.remove(id);
      setBudgets((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setIsMutating(false);
    }
  }, []);

  const copyFromPreviousMonth = useCallback(async (): Promise<BudgetItem[]> => {
    try {
      setIsMutating(true);
      const copied = await budgetService.copyFromPreviousMonth(selectedMonth);
      if (copied.length > 0) {
        setBudgets((prev) => [...copied, ...prev]);
      }
      return copied;
    } finally {
      setIsMutating(false);
    }
  }, [selectedMonth]);

  return {
    selectedMonth,
    setSelectedMonth,
    budgets,
    budgetsWithProgress,
    summary,
    isLoading,
    isMutating,
    error,
    refetch: fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    copyFromPreviousMonth,
  };
}