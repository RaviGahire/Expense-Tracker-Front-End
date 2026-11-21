import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  recurringService,
  getTodayDateString,
} from '../services/recurringService';
import type {
  RecurringFrequency,
  RecurringPayload,
  RecurringRule,
  RecurringRuleStatus,
  RecurringSummary,
} from '../types/recurring.types';
import type { TransactionFormValues } from '../../transactions/components/TransactionForm';

export interface UseRecurringOptions {
  onCreateTransaction?: (
    payload: TransactionFormValues
  ) => Promise<unknown> | unknown;
}

export interface UseRecurringReturn {
  rules: RecurringRule[];
  sortedRules: RecurringRule[];
  dueRules: RecurringRule[];
  summary: RecurringSummary;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createRule: (payload: RecurringPayload) => Promise<RecurringRule>;
  updateRule: (id: string, payload: RecurringPayload) => Promise<RecurringRule>;
  toggleRuleStatus: (id: string) => Promise<RecurringRule>;
  deleteRule: (id: string) => Promise<void>;
  runRuleNow: (rule: RecurringRule) => Promise<void>;
  processAllDueRules: () => Promise<number>;
}

const MONTHLY_MULTIPLIER_MAP: Record<RecurringFrequency, number> = {
  daily: 30,
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
  yearly: 1 / 12,
};

function getDaysUntilDate(targetDateStr: string, todayStr: string): number {
  const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number);
  const [cYear, cMonth, cDay] = todayStr.split('-').map(Number);

  if (
    Number.isNaN(tYear) ||
    Number.isNaN(tMonth) ||
    Number.isNaN(tDay) ||
    Number.isNaN(cYear) ||
    Number.isNaN(cMonth) ||
    Number.isNaN(cDay)
  ) {
    return 999;
  }

  const targetUtc = Date.UTC(tYear, tMonth - 1, tDay);
  const currentUtc = Date.UTC(cYear, cMonth - 1, cDay);
  return Math.round((targetUtc - currentUtc) / (1000 * 60 * 60 * 24));
}

export function useRecurring({
  onCreateTransaction,
}: UseRecurringOptions = {}): UseRecurringReturn {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await recurringService.getAll();
      setRules(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load recurring schedules. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Sort active schedules by soonest nextDate first, followed by paused & completed
  const sortedRules = useMemo<RecurringRule[]>(() => {
    const statusOrder: Record<RecurringRuleStatus, number> = {
      active: 0,
      paused: 1,
      completed: 2,
    };

    return [...rules].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.nextDate.localeCompare(b.nextDate);
    });
  }, [rules]);

  // Active schedules whose nextDate is today or earlier
  const dueRules = useMemo<RecurringRule[]>(() => {
    const today = getTodayDateString();
    return sortedRules.filter(
      (rule) => rule.status === 'active' && rule.nextDate <= today
    );
  }, [sortedRules]);

  // Aggregate KPI metrics & normalized monthly run-rates
  const summary = useMemo<RecurringSummary>(() => {
    const today = getTodayDateString();
    let activeCount = 0;
    let pausedCount = 0;
    let dueSoonCount = 0;
    let monthlyExpenseCommitment = 0;
    let monthlyIncomeCommitment = 0;

    for (const rule of rules) {
      if (rule.status === 'paused') {
        pausedCount += 1;
        continue;
      }

      if (rule.status !== 'active') {
        continue;
      }

      activeCount += 1;

      const daysUntil = getDaysUntilDate(rule.nextDate, today);
      if (daysUntil <= 7) {
        dueSoonCount += 1;
      }

      const monthlyEquivalent =
        (Number(rule.amount) || 0) * MONTHLY_MULTIPLIER_MAP[rule.frequency];

      if (rule.type === 'expense') {
        monthlyExpenseCommitment += monthlyEquivalent;
      } else {
        monthlyIncomeCommitment += monthlyEquivalent;
      }
    }

    const roundedExpense = Math.round(monthlyExpenseCommitment);
    const roundedIncome = Math.round(monthlyIncomeCommitment);

    return {
      totalRules: rules.length,
      activeCount,
      pausedCount,
      dueSoonCount,
      monthlyExpenseCommitment: roundedExpense,
      monthlyIncomeCommitment: roundedIncome,
      netMonthlyRecurring: roundedIncome - roundedExpense,
    };
  }, [rules]);

  const createRule = useCallback(
    async (payload: RecurringPayload): Promise<RecurringRule> => {
      try {
        setIsMutating(true);
        const created = await recurringService.create(payload);
        setRules((prev) => [created, ...prev]);
        return created;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const updateRule = useCallback(
    async (id: string, payload: RecurringPayload): Promise<RecurringRule> => {
      try {
        setIsMutating(true);
        const updated = await recurringService.update(id, payload);
        setRules((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const toggleRuleStatus = useCallback(
    async (id: string): Promise<RecurringRule> => {
      try {
        setIsMutating(true);
        const updated = await recurringService.toggleStatus(id);
        setRules((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const deleteRule = useCallback(async (id: string): Promise<void> => {
    try {
      setIsMutating(true);
      await recurringService.remove(id);
      setRules((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setIsMutating(false);
    }
  }, []);

  const runRuleNow = useCallback(
    async (rule: RecurringRule): Promise<void> => {
      try {
        setIsMutating(true);
        const { updatedRule, transactionPayload } =
          await recurringService.triggerOccurrence(rule, getTodayDateString());

        if (onCreateTransaction) {
          await onCreateTransaction(transactionPayload);
        }

        setRules((prev) =>
          prev.map((item) => (item.id === rule.id ? updatedRule : item))
        );
      } finally {
        setIsMutating(false);
      }
    },
    [onCreateTransaction]
  );

  const processAllDueRules = useCallback(async (): Promise<number> => {
    const today = getTodayDateString();
    const pendingDue = rules.filter(
      (rule) =>
        rule.status === 'active' && rule.autoCreate && rule.nextDate <= today
    );

    if (pendingDue.length === 0) return 0;

    try {
      setIsMutating(true);
      let processedCount = 0;

      for (const rule of pendingDue) {
        const { updatedRule, transactionPayload } =
          await recurringService.triggerOccurrence(rule, rule.nextDate);

        if (onCreateTransaction) {
          await onCreateTransaction(transactionPayload);
        }

        setRules((prev) =>
          prev.map((item) => (item.id === rule.id ? updatedRule : item))
        );
        processedCount += 1;
      }

      return processedCount;
    } finally {
      setIsMutating(false);
    }
  }, [rules, onCreateTransaction]);

  return {
    rules,
    sortedRules,
    dueRules,
    summary,
    isLoading,
    isMutating,
    error,
    refetch: fetchRules,
    createRule,
    updateRule,
    toggleRuleStatus,
    deleteRule,
    runRuleNow,
    processAllDueRules,
  };
}