import { useState, useEffect, useCallback, useMemo } from 'react';
import { goalService } from '../services/goalService';
import type {
  ContributionPayload,
  GoalPayload,
  GoalPriority,
  GoalStatus,
  SavingsGoal,
} from '../types/goal.types';

export type GoalFilterTab = 'all' | GoalStatus;

export interface GoalsSummary {
  totalSaved: number;
  totalTarget: number;
  totalRemaining: number;
  overallProgress: number;
  activeCount: number;
  completedCount: number;
  pausedCount: number;
}

export interface UseGoalsReturn {
  goals: SavingsGoal[];
  filteredGoals: SavingsGoal[];
  statusFilter: GoalFilterTab;
  setStatusFilter: (tab: GoalFilterTab) => void;
  summary: GoalsSummary;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createGoal: (payload: GoalPayload) => Promise<SavingsGoal>;
  updateGoal: (id: string, payload: GoalPayload) => Promise<SavingsGoal>;
  contributeToGoal: (
    id: string,
    payload: ContributionPayload
  ) => Promise<SavingsGoal>;
  toggleGoalPause: (id: string) => Promise<SavingsGoal>;
  deleteGoal: (id: string) => Promise<void>;
}

const PRIORITY_RANK: Record<GoalPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [statusFilter, setStatusFilter] = useState<GoalFilterTab>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await goalService.getAll();
      setGoals(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load savings goals. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Filtered + Priority-sorted list
  const filteredGoals = useMemo(() => {
    const matching =
      statusFilter === 'all'
        ? goals
        : goals.filter((goal) => goal.status === statusFilter);

    return [...matching].sort((a, b) => {
      // Completed goals naturally sit after active/paused goals when viewing 'all'
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    });
  }, [goals, statusFilter]);

  // Aggregate KPI metrics across all goals
  const summary = useMemo<GoalsSummary>(() => {
    let totalSaved = 0;
    let totalTarget = 0;
    let activeCount = 0;
    let completedCount = 0;
    let pausedCount = 0;

    for (const goal of goals) {
      totalSaved += goal.currentAmount;
      totalTarget += goal.targetAmount;

      if (goal.status === 'active') activeCount += 1;
      else if (goal.status === 'completed') completedCount += 1;
      else if (goal.status === 'paused') pausedCount += 1;
    }

    const totalRemaining = Math.max(0, totalTarget - totalSaved);
    const overallProgress =
      totalTarget > 0
        ? Math.min(100, Math.round((totalSaved / totalTarget) * 100))
        : 0;

    return {
      totalSaved,
      totalTarget,
      totalRemaining,
      overallProgress,
      activeCount,
      completedCount,
      pausedCount,
    };
  }, [goals]);

  const createGoal = useCallback(async (payload: GoalPayload) => {
    try {
      setIsMutating(true);
      const created = await goalService.create(payload);
      setGoals((prev) => [created, ...prev]);
      return created;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateGoal = useCallback(async (id: string, payload: GoalPayload) => {
    try {
      setIsMutating(true);
      const updated = await goalService.update(id, payload);
      setGoals((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      return updated;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const contributeToGoal = useCallback(
    async (id: string, payload: ContributionPayload) => {
      try {
        setIsMutating(true);
        const updated = await goalService.addContribution(id, payload);
        setGoals((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const toggleGoalPause = useCallback(async (id: string) => {
    try {
      setIsMutating(true);
      const updated = await goalService.togglePause(id);
      setGoals((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      return updated;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      setIsMutating(true);
      await goalService.remove(id);
      setGoals((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    goals,
    filteredGoals,
    statusFilter,
    setStatusFilter,
    summary,
    isLoading,
    isMutating,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    contributeToGoal,
    toggleGoalPause,
    deleteGoal,
  };
}