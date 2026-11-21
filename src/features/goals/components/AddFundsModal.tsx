import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { IconPlus, IconSparkles, IconHistory } from '@tabler/icons-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { CategoryIcon } from '../../categories/components/CategoryIcon';
import { contributionSchema } from '../schemas/goalSchema';
import { getTodayGoalDate } from '../services/goalService';
import type { ContributionPayload, SavingsGoal } from '../types/goal.types';

export interface AddFundsModalProps {
  isOpen: boolean;
  goal: SavingsGoal | null;
  currency?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (goalId: string, payload: ContributionPayload) => Promise<void>;
}

const QUICK_AMOUNT_PRESETS = [1000, 2500, 5000, 10000];

function formatCurrency(amount: number, currency: string = 'INR'): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.max(0, amount));
}

export function AddFundsModal({
  isOpen,
  goal,
  currency = 'INR',
  isSubmitting = false,
  onClose,
  onSubmit,
}: AddFundsModalProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayGoalDate());
  const [note, setNote] = useState('');
  const [recordAsTransaction, setRecordAsTransaction] = useState(false);
  const [errors, setErrors] = useState<{
    amount?: string;
    date?: string;
    note?: string;
  }>({});

  useEffect(() => {
    if (!isOpen || !goal) return;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const defaultSuggested =
      remaining > 0 && remaining < 5000 ? String(remaining) : '';
    setAmount(defaultSuggested);
    setDate(getTodayGoalDate());
    setNote('');
    setRecordAsTransaction(false);
    setErrors({});
  }, [isOpen, goal]);

  const { remainingAmount, currentPct, projectedPct, willComplete } =
    useMemo(() => {
      if (!goal) {
        return {
          remainingAmount: 0,
          currentPct: 0,
          projectedPct: 0,
          willComplete: false,
        };
      }

      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const numericAdd = Number(amount);
      const validAdd =
        !Number.isNaN(numericAdd) && numericAdd > 0 ? numericAdd : 0;

      const curPct =
        goal.targetAmount > 0
          ? Math.min(
              100,
              Math.round((goal.currentAmount / goal.targetAmount) * 100)
            )
          : 0;
      const projTotal = goal.currentAmount + validAdd;
      const projPct =
        goal.targetAmount > 0
          ? Math.min(100, Math.round((projTotal / goal.targetAmount) * 100))
          : 0;

      return {
        remainingAmount: remaining,
        currentPct: curPct,
        projectedPct: projPct,
        willComplete:
          goal.status !== 'completed' &&
          validAdd > 0 &&
          projTotal >= goal.targetAmount,
      };
    }, [goal, amount]);

  if (!goal) return null;

  const handlePresetClick = (presetValue: number) => {
    const currentNumeric = Number(amount);
    const base =
      !Number.isNaN(currentNumeric) && currentNumeric > 0 ? currentNumeric : 0;
    setAmount(String(base + presetValue));
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = contributionSchema.safeParse({
      amount: amount === '' ? Number.NaN : Number(amount),
      date,
      note: note.trim() || undefined,
      recordAsTransaction,
    });

    if (!parsed.success) {
      const nextErrors: { amount?: string; date?: string; note?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as 'amount' | 'date' | 'note' | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    await onSubmit(goal.id, parsed.data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Funds to Goal"
      description="Record a deposit toward your target balance."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Summary Banner */}
        <div className="rounded-xl border border-subtle bg-surface-elevated/45 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <CategoryIcon
                name={goal.iconName}
                label={goal.title}
                type="income"
                color={goal.color}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-primary">
                  {goal.title}
                </p>
                <p className="text-xs text-ink-secondary">
                  {formatCurrency(goal.currentAmount, currency)} of{' '}
                  {formatCurrency(goal.targetAmount, currency)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold text-brand">
                {currentPct}%
                {projectedPct > currentPct && (
                  <span className="text-income"> → {projectedPct}%</span>
                )}
              </span>
              {remainingAmount > 0 && (
                <p className="text-[11px] text-ink-muted">
                  {formatCurrency(remainingAmount, currency)} left
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar with Projected Gain Preview */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
            <div
              style={{ width: `${projectedPct}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                willComplete ? 'bg-income' : 'bg-brand'
              }`}
            />
          </div>

          {willComplete && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-income">
              <IconSparkles className="h-3.5 w-3.5" stroke={1.75} />
              This deposit completes your goal!
            </p>
          )}
        </div>

        {/* Amount Input & Quick Chips */}
        <div className="space-y-2">
          <Input
            label="Deposit Amount"
            type="number"
            min="1"
            step="any"
            placeholder="5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            required
          />

          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_AMOUNT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="rounded-lg border border-subtle bg-surface-elevated/50 px-2.5 py-1 text-xs font-semibold text-ink-secondary transition-colors hover:border-brand/40 hover:text-brand"
              >
                +{formatCurrency(preset, currency)}
              </button>
            ))}

            {remainingAmount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAmount(String(remainingAmount));
                  setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                className="rounded-lg border border-income/30 bg-income/10 px-2.5 py-1 text-xs font-semibold text-income transition-colors hover:bg-income/20"
              >
                Full Remaining ({formatCurrency(remainingAmount, currency)})
              </button>
            )}
          </div>
        </div>

        {/* Date & Optional Note */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Deposit Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
            required
          />

          <Input
            label="Note (Optional)"
            placeholder="e.g., Monthly auto-save"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            error={errors.note}
          />
        </div>

        {/* Optional Transaction Ledger Sync Toggle */}
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-subtle/80 bg-surface-elevated/35 px-3.5 py-2.5">
          <div>
            <p className="text-xs font-semibold text-ink-primary">
              Also log in Transactions ledger
            </p>
            <p className="text-[11px] text-ink-muted">
              Records an outflow entry under "{goal.category}"
            </p>
          </div>
          <input
            type="checkbox"
            checked={recordAsTransaction}
            onChange={(e) => setRecordAsTransaction(e.target.checked)}
            className="h-4 w-4 rounded border-subtle accent-brand"
          />
        </label>

        {/* Recent Deposits Log */}
        {goal.contributions.length > 0 && (
          <div className="rounded-xl border border-subtle/70 bg-surface-elevated/25 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-secondary">
              <IconHistory className="h-3.5 w-3.5" stroke={1.75} />
              Recent Contributions ({goal.contributions.length})
            </div>
            <div className="max-h-28 space-y-1.5 overflow-y-auto pr-1 text-xs">
              {goal.contributions.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-surface-elevated/50 px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-ink-primary">
                      {entry.note || 'Deposit'}
                    </span>
                    <span className="ml-2 text-[11px] text-ink-muted">
                      {entry.date}
                    </span>
                  </div>
                  <span className="shrink-0 font-bold text-income">
                    +{formatCurrency(entry.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-subtle pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            <IconPlus className="h-4 w-4" stroke={2} />
            {isSubmitting ? 'Adding...' : 'Add Funds'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}