import { useState, useMemo } from 'react';
import {
  IconPlus,
  IconRepeat,
  IconArrowDownRight,
  IconArrowUpRight,
  IconCalendarStats,
  IconBolt,
  IconCheck,
} from '@tabler/icons-react';
import { useAuth } from '../../auth';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import { useRecurring } from '../hooks/useRecurring';
import { RecurringRuleCard } from '../components/RecurringRuleCard';
import { RecurringModal } from '../components/RecurringModal';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import type {
  RecurringPayload,
  RecurringRule,
  RecurringRuleStatus,
} from '../types/recurring.types';

type RecurringTabFilter = 'all' | 'due' | RecurringRuleStatus;

function formatRecurringSummaryCurrency(
  amount: number,
  currency: string = 'INR'
): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function RecurringPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';

  const { createTransaction } = useTransactions();
  const {
    sortedRules,
    dueRules,
    summary,
    isLoading,
    isMutating,
    error,
    refetch,
    createRule,
    updateRule,
    toggleRuleStatus,
    deleteRule,
    runRuleNow,
    processAllDueRules,
  } = useRecurring({
    onCreateTransaction: async (txPayload) => {
      await createTransaction(txPayload);
    },
  });

  const [activeFilter, setActiveFilter] = useState<RecurringTabFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deletingRule, setDeletingRule] = useState<RecurringRule | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const filteredRules = useMemo(() => {
    if (activeFilter === 'all') return sortedRules;
    if (activeFilter === 'due') return dueRules;
    return sortedRules.filter((rule) => rule.status === activeFilter);
  }, [sortedRules, dueRules, activeFilter]);

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: RecurringRule) => {
    setEditingRule(rule);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isMutating) return;
    setIsModalOpen(false);
    setEditingRule(null);
    setModalError(null);
  };

  const handleSaveRule = async (payload: RecurringPayload) => {
    try {
      setModalError(null);
      if (editingRule?.id) {
        await updateRule(editingRule.id, payload);
        setFeedbackBanner(`Updated "${payload.title}" schedule.`);
      } else {
        await createRule(payload);
        setFeedbackBanner(`Created "${payload.title}" recurring schedule.`);
      }
      setIsModalOpen(false);
      setEditingRule(null);
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : 'Unable to save recurring schedule. Please try again.'
      );
    }
  };

  const handleToggleRuleStatus = async (rule: RecurringRule) => {
    try {
      const updated = await toggleRuleStatus(rule.id);
      setFeedbackBanner(
        updated.status === 'paused'
          ? `Paused "${updated.title}".`
          : `Resumed "${updated.title}".`
      );
    } catch (err) {
      setFeedbackBanner(
        err instanceof Error ? err.message : 'Unable to update schedule status.'
      );
    }
  };

  const handleRunRuleNow = async (rule: RecurringRule) => {
    try {
      await runRuleNow(rule);
      setFeedbackBanner(
        `Logged "${rule.title}" (${formatRecurringSummaryCurrency(
          rule.amount,
          currency
        )}) to Transactions and advanced its next date.`
      );
    } catch (err) {
      setFeedbackBanner(
        err instanceof Error ? err.message : 'Unable to log transaction now.'
      );
    }
  };

  const handleProcessAllDue = async () => {
    try {
      const count = await processAllDueRules();
      if (count === 0) {
        setFeedbackBanner(
          'No auto-enabled schedules are currently due for processing.'
        );
      } else {
        setFeedbackBanner(
          `Processed ${count} due ${
            count === 1 ? 'schedule' : 'schedules'
          } and recorded ${count === 1 ? 'its' : 'their'} transactions.`
        );
      }
    } catch (err) {
      setFeedbackBanner(
        err instanceof Error
          ? err.message
          : 'Unable to process due schedules.'
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRule) return;
    try {
      const deletedTitle = deletingRule.title;
      await deleteRule(deletingRule.id);
      setDeletingRule(null);
      setFeedbackBanner(`Deleted "${deletedTitle}" recurring schedule.`);
    } catch {
      // Keep confirmation dialog open if deletion fails
    }
  };

  const completedCount = useMemo(
    () => sortedRules.filter((rule) => rule.status === 'completed').length,
    [sortedRules]
  );

  const filterTabs: {
    key: RecurringTabFilter;
    label: string;
    count: number;
  }[] = [
    { key: 'all', label: 'All Schedules', count: summary.totalRules },
    { key: 'due', label: 'Due Now', count: dueRules.length },
    { key: 'active', label: 'Active', count: summary.activeCount },
    { key: 'paused', label: 'Paused', count: summary.pausedCount },
    { key: 'completed', label: 'Completed', count: completedCount },
  ];

  const isNetPositive = summary.netMonthlyRecurring >= 0;

  return (
    <section className="space-y-6">
      {/* Page Header & Primary Actions */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            Recurring Schedules
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Automate repeating bills, subscriptions, rent, and salary credits with one-click transaction logging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {dueRules.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleProcessAllDue}
              disabled={isLoading || isMutating}
              leftIcon={<IconBolt className="h-4 w-4 text-warning" stroke={2} />}
            >
              Process Due ({dueRules.length})
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            onClick={handleOpenCreateModal}
            disabled={isLoading || isMutating}
            leftIcon={<IconPlus className="h-4 w-4" stroke={2} />}
          >
            New Schedule
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedbackBanner && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-xs text-ink-primary">
          <div className="flex items-center gap-2">
            <IconCheck className="h-4 w-4 shrink-0 text-brand" stroke={2} />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="shrink-0 font-semibold text-brand hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error State vs. Active Workspace */}
      {error ? (
        <ErrorState
          title="Unable to load recurring schedules"
          message={error}
          onRetry={refetch}
          isRetrying={isLoading}
        />
      ) : (
        <>
          {/* 4-Card Monthly Run-Rate Summary Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-secondary">
                  Est. Monthly Expenses
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-expense">
                  {formatRecurringSummaryCurrency(
                    summary.monthlyExpenseCommitment,
                    currency
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Normalized across active bills
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-expense/15 text-expense">
                <IconArrowDownRight className="h-5 w-5" stroke={1.75} />
              </div>
            </Card>

            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-secondary">
                  Est. Monthly Income
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-income">
                  {formatRecurringSummaryCurrency(
                    summary.monthlyIncomeCommitment,
                    currency
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Scheduled salary & retainers
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-income/15 text-income">
                <IconArrowUpRight className="h-5 w-5" stroke={1.75} />
              </div>
            </Card>

            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-secondary">
                  Net Monthly Recurring
                </p>
                <p
                  className={`mt-1 text-2xl font-bold tracking-tight ${
                    isNetPositive ? 'text-income' : 'text-expense'
                  }`}
                >
                  {isNetPositive ? '+' : '-'}
                  {formatRecurringSummaryCurrency(
                    summary.netMonthlyRecurring,
                    currency
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Recurring income minus bills
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <IconRepeat className="h-5 w-5" stroke={1.75} />
              </div>
            </Card>

            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-secondary">
                  Due Within 7 Days
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-2xl font-bold tracking-tight text-ink-primary">
                    {summary.dueSoonCount}
                  </p>
                  {dueRules.length > 0 && (
                    <Badge variant="warning">{dueRules.length} due now</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {summary.activeCount} active • {summary.pausedCount} paused
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <IconCalendarStats className="h-5 w-5" stroke={1.75} />
              </div>
            </Card>
          </div>

          {/* Filter Tabs */}
          {sortedRules.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-brand bg-brand/15 text-brand'
                        : 'border-subtle bg-surface text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                        isActive
                          ? 'bg-brand text-canvas'
                          : 'bg-surface-elevated text-ink-muted'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recurring Schedule Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} className="animate-pulse space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-surface-elevated" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-surface-elevated" />
                        <div className="h-3 w-28 rounded bg-surface-elevated" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-9 w-9 rounded-lg bg-surface-elevated" />
                      <div className="h-9 w-9 rounded-lg bg-surface-elevated" />
                    </div>
                  </div>
                  <div className="h-12 w-full rounded-xl bg-surface-elevated" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-surface-elevated" />
                    <div className="h-3 w-3/4 rounded bg-surface-elevated" />
                  </div>
                </Card>
              ))}
            </div>
          ) : sortedRules.length === 0 ? (
            <EmptyState
              icon={<IconRepeat className="h-7 w-7" stroke={1.75} />}
              title="No recurring schedules yet"
              description="Set up automated schedules for monthly rent, utility bills, subscriptions, or salary credits."
              actionLabel="Create First Schedule"
              onAction={handleOpenCreateModal}
            />
          ) : filteredRules.length === 0 ? (
            <EmptyState
              icon={<IconRepeat className="h-7 w-7" stroke={1.75} />}
              title="No schedules match this filter"
              description="Switch back to All Schedules to view every active, paused, and completed rule."
              actionLabel="Show All Schedules"
              onAction={() => setActiveFilter('all')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRules.map((rule) => (
                <RecurringRuleCard
                  key={rule.id}
                  rule={rule}
                  currency={currency}
                  onEdit={handleOpenEditModal}
                  onDelete={setDeletingRule}
                  onToggleStatus={handleToggleRuleStatus}
                  onRunNow={handleRunRuleNow}
                  disabled={isMutating}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create / Edit Recurring Schedule Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingRule={editingRule}
        onSubmit={handleSaveRule}
        isSubmitting={isMutating}
        serverError={modalError}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingRule)}
        onClose={() => {
          if (!isMutating) setDeletingRule(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Recurring Schedule"
        message={`Are you sure you want to delete "${
          deletingRule?.title ?? ''
        }"? Past transactions already logged by this schedule will remain in your history.`}
        confirmText="Delete Schedule"
        cancelText="Keep Schedule"
        isLoading={isMutating}
      />
    </section>
  );
}