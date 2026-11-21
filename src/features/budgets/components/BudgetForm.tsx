import { useState, useEffect, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconCurrencyRupee,
  IconCalendar,
  IconBellRinging,
  IconNotes,
  IconAlertCircle,
  IconRepeat,
} from '@tabler/icons-react';
import { Input } from '../../../components/ui/Input';
import { SelectInput } from '../../../components/ui/SelectInput';
import { Button } from '../../../components/ui/Button';
import { useCategoriesContext } from '../../categories/context/CategoriesContext';
import {
  CategorySelect,
  DEFAULT_CATEGORY_OPTIONS,
} from '../../categories/components/CategorySelect';
import { validateBudgetInput } from '../schemas/budgetSchema';
import { getCurrentMonthString } from '../services/budgetService';
import type {
  BudgetItem,
  BudgetPayload,
  BudgetPeriod,
} from '../types/budget.types';

export interface BudgetFormProps {
  initialValues?: Partial<BudgetItem> | null;
  existingBudgets?: BudgetItem[];
  defaultMonth?: string;
  onSubmit: (payload: BudgetPayload) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  submitLabel?: string;
}

interface InternalBudgetFormState {
  category: string;
  limit: string;
  period: BudgetPeriod;
  month: string;
  alertThreshold: number;
  notes: string;
}

type BudgetFormErrors = Partial<
  Record<keyof InternalBudgetFormState, string>
>;

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'yearly', label: 'Yearly' },
];

const THRESHOLD_PRESETS = [70, 80, 90, 100] as const;

function buildInitialFormState(
  initialValues?: Partial<BudgetItem> | null,
  defaultMonth?: string,
  fallbackCategory?: string
): InternalBudgetFormState {
  return {
    category: initialValues?.category ?? fallbackCategory ?? 'Food & Dining',
    limit:
      typeof initialValues?.limit === 'number' && initialValues.limit > 0
        ? String(initialValues.limit)
        : '',
    period: initialValues?.period ?? 'monthly',
    month: initialValues?.month ?? defaultMonth ?? getCurrentMonthString(),
    alertThreshold:
      typeof initialValues?.alertThreshold === 'number'
        ? initialValues.alertThreshold
        : 80,
    notes: initialValues?.notes ?? '',
  };
}

export function BudgetForm({
  initialValues = null,
  existingBudgets = [],
  defaultMonth,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError = null,
  submitLabel,
}: BudgetFormProps) {
  const navigate = useNavigate();
  const { categories } = useCategoriesContext();

  const isEditMode = Boolean(initialValues?.id);

  const expenseCategories = useMemo(() => {
    const source =
      categories.length > 0 ? categories : DEFAULT_CATEGORY_OPTIONS;
    return source.filter((cat) => cat.type === 'expense');
  }, [categories]);

  // Suggest the first unbudgeted expense category for the active month when creating
  const defaultSuggestedCategory = useMemo(() => {
    const activeMonth =
      initialValues?.month ?? defaultMonth ?? getCurrentMonthString();
    const usedSet = new Set(
      existingBudgets
        .filter((b) => b.month === activeMonth && b.id !== initialValues?.id)
        .map((b) => b.category.trim().toLowerCase())
    );

    const firstUnused = expenseCategories.find(
      (cat) => !usedSet.has(cat.value.trim().toLowerCase())
    );
    return (
      firstUnused?.value ??
      expenseCategories[0]?.value ??
      'Food & Dining'
    );
  }, [
    expenseCategories,
    existingBudgets,
    initialValues?.id,
    initialValues?.month,
    defaultMonth,
  ]);

  const [values, setValues] = useState<InternalBudgetFormState>(() =>
    buildInitialFormState(initialValues, defaultMonth, defaultSuggestedCategory)
  );
  const [errors, setErrors] = useState<BudgetFormErrors>({});

  useEffect(() => {
    setValues(
      buildInitialFormState(
        initialValues,
        defaultMonth,
        defaultSuggestedCategory
      )
    );
    setErrors({});
  }, [initialValues, defaultMonth, defaultSuggestedCategory]);

  const handleFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof InternalBudgetFormState]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleCategoryChange = (nextCategory: string) => {
    setValues((prev) => ({
      ...prev,
      category: nextCategory,
    }));

    if (errors.category) {
      setErrors((prev) => ({
        ...prev,
        category: undefined,
      }));
    }
  };

  const handleThresholdChange = (nextThreshold: number) => {
    const clamped = Math.min(100, Math.max(50, Math.round(nextThreshold)));
    setValues((prev) => ({
      ...prev,
      alertThreshold: clamped,
    }));

    if (errors.alertThreshold) {
      setErrors((prev) => ({
        ...prev,
        alertThreshold: undefined,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedLimit = values.limit.trim() === '' ? NaN : Number(values.limit);

    const validation = validateBudgetInput(
      {
        category: values.category,
        limit: parsedLimit,
        period: values.period,
        month: values.month,
        alertThreshold: values.alertThreshold,
        notes: values.notes.trim() || undefined,
      },
      existingBudgets,
      initialValues?.id
    );

    if (!validation.success || !validation.data) {
      setErrors(validation.fieldErrors);
      return;
    }

    setErrors({});
    await onSubmit({
      category: validation.data.category,
      limit: validation.data.limit,
      period: validation.data.period,
      month: validation.data.month,
      alertThreshold: validation.data.alertThreshold,
      notes: validation.data.notes,
    });
  };

  const resolvedSubmitLabel =
    submitLabel || (isEditMode ? 'Update Budget' : 'Create Budget');

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Server / API Error Banner */}
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-expense/30 bg-expense/10 p-3.5 text-xs text-expense"
        >
          <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0" stroke={2} />
          <span>{serverError}</span>
        </div>
      )}

      {/* Expense Category Selector */}
      <CategorySelect
        label="Expense Category"
        value={values.category}
        onChange={handleCategoryChange}
        categories={expenseCategories}
        filterByType="expense"
        error={errors.category}
        disabled={isSubmitting}
        onCreateCategory={() => {
          onCancel?.();
          navigate('/categories');
        }}
      />

      {/* Budget Limit & Period Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Spending Limit"
          name="limit"
          type="number"
          inputMode="decimal"
          min="1"
          step="any"
          placeholder="5000"
          value={values.limit}
          onChange={handleFieldChange}
          error={errors.limit}
          disabled={isSubmitting}
          leftIcon={<IconCurrencyRupee className="h-4 w-4" stroke={1.75} />}
        />

        <SelectInput
          label="Budget Period"
          name="period"
          value={values.period}
          onChange={handleFieldChange}
          options={PERIOD_OPTIONS}
          error={errors.period}
          disabled={isSubmitting}
          leftIcon={<IconRepeat className="h-4 w-4" stroke={1.75} />}
        />
      </div>

      {/* Target Month */}
      <Input
        label="Target Month"
        name="month"
        type="month"
        value={values.month}
        onChange={handleFieldChange}
        error={errors.month}
        disabled={isSubmitting}
        leftIcon={<IconCalendar className="h-4 w-4" stroke={1.75} />}
      />

      {/* Alert Threshold Control */}
      <div className="space-y-2.5 rounded-xl border border-subtle bg-surface-elevated/40 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="budget-alert-threshold"
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-primary"
          >
            <IconBellRinging className="h-4 w-4 text-warning" stroke={1.75} />
            <span>Warning Alert Threshold</span>
          </label>

          <span className="rounded-lg bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">
            {values.alertThreshold}%
          </span>
        </div>

        <input
          id="budget-alert-threshold"
          type="range"
          min={50}
          max={100}
          step={5}
          value={values.alertThreshold}
          onChange={(e) => handleThresholdChange(Number(e.target.value))}
          disabled={isSubmitting}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-elevated accent-brand"
        />

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-ink-muted">
            Trigger warning badge at {values.alertThreshold}% spent
          </span>

          <div className="flex items-center gap-1">
            {THRESHOLD_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleThresholdChange(preset)}
                disabled={isSubmitting}
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  values.alertThreshold === preset
                    ? 'bg-brand text-canvas'
                    : 'bg-surface text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        {errors.alertThreshold && (
          <p className="text-xs text-expense">{errors.alertThreshold}</p>
        )}
      </div>

      {/* Optional Notes */}
      <Input
        label="Notes (Optional)"
        name="notes"
        type="text"
        placeholder="e.g., Includes weekend dining and groceries..."
        value={values.notes}
        onChange={handleFieldChange}
        error={errors.notes}
        disabled={isSubmitting}
        leftIcon={<IconNotes className="h-4 w-4" stroke={1.75} />}
      />

      {/* Footer Actions */}
      <div className="mt-6 flex flex-col-reverse gap-2.5 border-t border-subtle pt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="w-full sm:w-auto"
        >
          {resolvedSubmitLabel}
        </Button>
      </div>
    </form>
  );
}