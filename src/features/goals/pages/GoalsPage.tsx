import { useState } from 'react';
import {
  IconPlus,
  IconTargetArrow,
  IconPigMoney,
  IconCircleCheck,
  IconHourglassHigh,
  IconAlertCircle,
  IconRefresh,
  IconSparkles,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useGoals, type GoalFilterTab } from '../hooks/useGoals';
import { GoalList } from '../components/GoalList';
import { GoalFormModal } from '../components/GoalFormModal';
import { AddFundsModal } from '../components/AddFundsModal';
import { transactionService } from '../../transactions/services/transactionService';
import type {
  ContributionPayload,
  GoalPayload,
  SavingsGoal,
} from '../types/goal.types';

function formatGoalsCurrency(amount: number, currency: string = 'INR'): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.max(0, amount));
}

export function GoalsPage() {
  const currency = 'INR';

  const {
    goals,
    filteredGoals,
    statusFilter,
    setStatusFilter,
    summary,
    isLoading,
    isMutating,
    error,
    refetch,
    createGoal,
    updateGoal,
    contributeToGoal,
    toggleGoalPause,
    deleteGoal,
  } = useGoals();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(
    null
  );
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const filterTabs: { id: GoalFilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Goals', count: goals.length },
    { id: 'active', label: 'Active', count: summary.activeCount },
    { id: 'completed', label: 'Completed', count: summary.completedCount },
    { id: 'paused', label: 'Paused', count: summary.pausedCount },
  ];

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsFormModalOpen(true);
  };

  const handleSaveGoal = async (payload: GoalPayload) => {
    if (editingGoal) {
      const updated = await updateGoal(editingGoal.id, payload);
      setBannerMessage(`Updated "${updated.title}".`);
    } else {
      const created = await createGoal(payload);
      setBannerMessage(`Created new goal "${created.title}".`);
    }
    setEditingGoal(null);
  };

  const handleContributeSubmit = async (
    goalId: string,
    payload: ContributionPayload
  ) => {
    const updated = await contributeToGoal(goalId, payload);

    if (payload.recordAsTransaction) {
      await transactionService.create({
        title: `Goal Deposit: ${updated.title}`,
        amount: payload.amount,
        type: 'expense',
        category: updated.category,
        date: payload.date,
        paymentMethod: 'Bank Transfer',
        notes: payload.note
          ? `${payload.note} (Savings Goal)`
          : `Contribution toward ${updated.title}`,
      });
    }

    const ledgerSuffix = payload.recordAsTransaction
      ? ' & logged in Transactions'
      : '';

    if (updated.status === 'completed') {
      setBannerMessage(
        `Congratulations! "${updated.title}" has reached 100% of its target${ledgerSuffix}!`
      );
    } else {
      setBannerMessage(
        `Added ${formatGoalsCurrency(payload.amount, currency)} to "${
          updated.title
        }"${ledgerSuffix}.`
      );
    }
  };

  const handleTogglePause = async (goal: SavingsGoal) => {
    const updated = await toggleGoalPause(goal.id);
    setBannerMessage(
      updated.status === 'paused'
        ? `Paused "${updated.title}".`
        : `Resumed "${updated.title}".`
    );
  };

  const handleConfirmDelete = async () => {
    if (!deletingGoal) return;
    const removedTitle = deletingGoal.title;
    await deleteGoal(deletingGoal.id);
    setDeletingGoal(null);
    setBannerMessage(`Deleted "${removedTitle}".`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
            Savings Goals
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Plan financial milestones, track target deadlines, and record incremental deposits
          </p>
        </div>

        <Button type="button" variant="primary" onClick={handleOpenCreate}>
          <IconPlus className="h-4 w-4" stroke={2} />
          New Goal
        </Button>
      </div>

      {/* Feedback Banner */}
      {bannerMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-income/35 bg-income/10 px-4 py-3 text-xs font-semibold text-income">
          <span className="inline-flex items-center gap-2">
            <IconSparkles className="h-4 w-4 shrink-0" stroke={1.75} />
            {bannerMessage}
          </span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-ink-secondary hover:text-ink-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <Card className="flex flex-col items-start justify-between gap-3 border-expense/40 bg-expense/10 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5 text-sm text-expense">
            <IconAlertCircle className="h-5 w-5 shrink-0" stroke={1.75} />
            <span>{error}</span>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={refetch}>
            <IconRefresh className="h-4 w-4" stroke={1.75} />
            Retry
          </Button>
        </Card>
      )}

      {/* 4-Card KPI Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Saved */}
        <Card className="flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-ink-secondary uppercase">
              Total Saved
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-income/15 text-income">
              <IconPigMoney className="h-4.5 w-4.5" stroke={1.75} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold tracking-tight text-income">
                {formatGoalsCurrency(summary.totalSaved, currency)}
              </p>
              <Badge variant="income">{summary.overallProgress}%</Badge>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
              <div
                style={{ width: `${summary.overallProgress}%` }}
                className="h-full rounded-full bg-income transition-all duration-300"
              />
            </div>
          </div>
        </Card>

        {/* Combined Target */}
        <Card className="flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-ink-secondary uppercase">
              Combined Target
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand">
              <IconTargetArrow className="h-4.5 w-4.5" stroke={1.75} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-ink-primary">
              {formatGoalsCurrency(summary.totalTarget, currency)}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Across {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
            </p>
          </div>
        </Card>

        {/* Remaining to Save */}
        <Card className="flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-ink-secondary uppercase">
              Remaining Needed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <IconHourglassHigh className="h-4.5 w-4.5" stroke={1.75} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-ink-primary">
              {formatGoalsCurrency(summary.totalRemaining, currency)}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Left to fully fund all goals
            </p>
          </div>
        </Card>

        {/* Milestones Completed */}
        <Card className="flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-ink-secondary uppercase">
              Milestones
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand">
              <IconCircleCheck className="h-4.5 w-4.5" stroke={1.75} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-ink-primary">
              {summary.completedCount}{' '}
              <span className="text-xs font-medium text-ink-muted">
                completed
              </span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {summary.activeCount} active • {summary.pausedCount} paused
            </p>
          </div>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter savings goals by status"
        className="flex flex-wrap items-center gap-2 border-b border-subtle pb-3"
      >
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-surface-elevated/45 text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-elevated text-ink-muted'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Goals Grid (Loading, Empty State, and GoalCard list) */}
      <GoalList
        goals={filteredGoals}
        statusFilter={statusFilter}
        currency={currency}
        isLoading={isLoading}
        isMutating={isMutating}
        onCreateNew={handleOpenCreate}
        onContribute={(targetGoal) => setContributingGoal(targetGoal)}
        onEdit={handleOpenEdit}
        onTogglePause={handleTogglePause}
        onDelete={(targetGoal) => setDeletingGoal(targetGoal)}
      />

      {/* Create / Edit Goal Modal */}
      <GoalFormModal
        isOpen={isFormModalOpen}
        initialGoal={editingGoal}
        isSubmitting={isMutating}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleSaveGoal}
      />

      {/* Quick Deposit / Add Funds Modal */}
      <AddFundsModal
        isOpen={Boolean(contributingGoal)}
        goal={contributingGoal}
        currency={currency}
        isSubmitting={isMutating}
        onClose={() => setContributingGoal(null)}
        onSubmit={handleContributeSubmit}
      />

      {/* Delete Confirmation Dialog */}
   {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingGoal)}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Savings Goal"
        message={
          deletingGoal
            ? `Are you sure you want to delete "${deletingGoal.title}" and its contribution history? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Goal"
        isLoading={isMutating}
        variant="danger"
      />
    </div>
  );
}