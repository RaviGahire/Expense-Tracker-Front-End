import { IconPlus, IconTargetArrow } from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { GoalCard } from './GoalCard';
import type { GoalFilterTab } from '../hooks/useGoals';
import type { SavingsGoal } from '../types/goal.types';

export interface GoalListProps {
  goals: SavingsGoal[];
  statusFilter: GoalFilterTab;
  currency?: string;
  isLoading?: boolean;
  isMutating?: boolean;
  onCreateNew: () => void;
  onContribute: (goal: SavingsGoal) => void;
  onEdit: (goal: SavingsGoal) => void;
  onTogglePause: (goal: SavingsGoal) => void;
  onDelete: (goal: SavingsGoal) => void;
}

export function GoalList({
  goals,
  statusFilter,
  currency = 'INR',
  isLoading = false,
  isMutating = false,
  onCreateNew,
  onContribute,
  onEdit,
  onTogglePause,
  onDelete,
}: GoalListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Card
            key={item}
            className="h-64 animate-pulse bg-surface-elevated/40"
          >
            <div className="h-5 w-36 rounded bg-surface-elevated" />
            <div className="mt-4 h-20 rounded-xl bg-surface-elevated" />
            <div className="mt-4 h-4 w-28 rounded bg-surface-elevated" />
          </Card>
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-brand">
          <IconTargetArrow className="h-6 w-6" stroke={1.75} />
        </div>
        <h2 className="mt-4 text-base font-bold text-ink-primary">
          {statusFilter === 'all'
            ? 'No savings goals yet'
            : `No ${statusFilter} goals`}
        </h2>
        <p className="mt-1 max-w-md text-xs text-ink-secondary">
          {statusFilter === 'all'
            ? 'Create your first goal—such as an emergency reserve, travel fund, or major purchase—and track every deposit.'
            : 'Switch filter tabs or create a new goal to start tracking your progress.'}
        </p>
        <div className="mt-5">
          <Button type="button" variant="primary" onClick={onCreateNew}>
            <IconPlus className="h-4 w-4" stroke={2} />
            Create Savings Goal
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          currency={currency}
          isMutating={isMutating}
          onContribute={onContribute}
          onEdit={onEdit}
          onTogglePause={onTogglePause}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}