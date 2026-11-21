import { useState, useEffect, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCurrencyRupee,
  IconCalendar,
  IconCreditCard,
  IconRepeat,
  IconNotes,
  IconAlertCircle,
  IconBolt,
} from '@tabler/icons-react';
import { Input } from '../../../components/ui/Input';
import { SelectInput } from '../../../components/ui/SelectInput';
import { Button } from '../../../components/ui/Button';
import {
  PAYMENT_METHOD_OPTIONS,
  type TransactionFormType,
} from '../../transactions/components/TransactionForm';
import { useCategoriesContext } from '../../categories/context/CategoriesContext';
import {
  CategorySelect,
  DEFAULT_CATEGORY_OPTIONS,
  type CategoryOptionItem,
} from '../../categories/components/CategorySelect';
import { validateRecurringInput } from '../schemas/recurringSchema';
import {
  advanceRecurringDate,
  getTodayDateString,
} from '../services/recurringService';
import type {
  RecurringFrequency,
  RecurringPayload,
  RecurringRule,
  RecurringRuleStatus,
} from '../types/recurring.types';

export interface RecurringFormProps {
  initialValues?: Partial<RecurringRule> | null;
  onSubmit: (payload: RecurringPayload) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  submitLabel?: string;
}

interface InternalRecurringFormState {
  title: string;
  amount: string;
  type: TransactionFormType;
  category: string;
  paymentMethod: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDate: string;
  endDate: string;
  status: RecurringRuleStatus;
  autoCreate: boolean;
  notes: string;
}

type RecurringFormErrors = Partial<
  Record<keyof InternalRecurringFormState, string>
>;

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly (Every 2 weeks)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

function getDefaultCategoryForType(
  type: TransactionFormType,
  categories: CategoryOptionItem[]
): string {
  const match = categories.find((cat) => cat.type === type);
  if (match) return match.value;
  return type === 'expense' ? 'Bills & Utilities' : 'Salary';
}

function buildInitialFormState(
  initialValues?: Partial<RecurringRule> | null,
  categories: CategoryOptionItem[] = DEFAULT_CATEGORY_OPTIONS
): InternalRecurringFormState {
  const resolvedType: TransactionFormType = initialValues?.type ?? 'expense';
  const resolvedFrequency: RecurringFrequency =
    initialValues?.frequency ?? 'monthly';
  const resolvedStartDate = initialValues?.startDate ?? getTodayDateString();
  const resolvedNextDate =
    initialValues?.nextDate ??
    advanceRecurringDate(resolvedStartDate, resolvedFrequency);

  return {
    title: initialValues?.title ?? '',
    amount:
      typeof initialValues?.amount === 'number' && initialValues.amount > 0
        ? String(initialValues.amount)
        : '',
    type: resolvedType,
    category:
      initialValues?.category ??
      getDefaultCategoryForType(resolvedType, categories),
    paymentMethod:
      initialValues?.paymentMethod ?? PAYMENT_METHOD_OPTIONS[0].value,
    frequency: resolvedFrequency,
    startDate: resolvedStartDate,
    nextDate: resolvedNextDate,
    endDate: initialValues?.endDate ?? '',
    status: initialValues?.status ?? 'active',
    autoCreate:
      typeof initialValues?.autoCreate === 'boolean'
        ? initialValues.autoCreate
        : true,
    notes: initialValues?.notes ?? '',
  };
}

export function RecurringForm({
  initialValues = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError = null,
  submitLabel,
}: RecurringFormProps) {
  const navigate = useNavigate();
  const { categories } = useCategoriesContext();

  const resolvedCategories = useMemo(
    () => (categories.length > 0 ? categories : DEFAULT_CATEGORY_OPTIONS),
    [categories]
  );

  const isEditMode = Boolean(initialValues?.id);

  const [values, setValues] = useState<InternalRecurringFormState>(() =>
    buildInitialFormState(initialValues, resolvedCategories)
  );
  const [hasManuallyEditedNextDate, setHasManuallyEditedNextDate] =
    useState<boolean>(Boolean(initialValues?.nextDate));
  const [errors, setErrors] = useState<RecurringFormErrors>({});

  useEffect(() => {
    setValues(buildInitialFormState(initialValues, resolvedCategories));
    setHasManuallyEditedNextDate(Boolean(initialValues?.nextDate));
    setErrors({});
  }, [initialValues, resolvedCategories]);

  const handleTypeSwitch = (nextType: TransactionFormType) => {
    if (values.type === nextType || isSubmitting) return;

    const validCategories = resolvedCategories.filter(
      (cat) => cat.type === nextType
    );
    const isCurrentValid = validCategories.some(
      (cat) => cat.value.trim().toLowerCase() === values.category.trim().toLowerCase()
    );

    setValues((prev) => ({
      ...prev,
      type: nextType,
      category: isCurrentValid
        ? prev.category
        : getDefaultCategoryForType(nextType, resolvedCategories),
    }));

    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  const handleFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setValues((prev) => {
      const next: InternalRecurringFormState = {
        ...prev,
        [name]: value,
      };

      if (name === 'nextDate') {
        setHasManuallyEditedNextDate(true);
      }

      if (
        (name === 'frequency' || name === 'startDate') &&
        !hasManuallyEditedNextDate &&
        !isEditMode
      ) {
        const baseStart = name === 'startDate' ? value : prev.startDate;
        const baseFreq = (
          name === 'frequency' ? value : prev.frequency
        ) as RecurringFrequency;

        if (baseStart) {
          next.nextDate = advanceRecurringDate(baseStart, baseFreq);
        }
      }

      return next;
    });

    if (errors[name as keyof InternalRecurringFormState]) {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedAmount =
      values.amount.trim() === '' ? NaN : Number(values.amount);

    const validation = validateRecurringInput({
      title: values.title,
      amount: parsedAmount,
      type: values.type,
      category: values.category,
      paymentMethod: values.paymentMethod,
      frequency: values.frequency,
      startDate: values.startDate,
      nextDate: values.nextDate,
      endDate: values.endDate.trim() || undefined,
      status: values.status,
      autoCreate: values.autoCreate,
      notes: values.notes.trim() || undefined,
    });

    if (!validation.success || !validation.data) {
      setErrors(validation.fieldErrors);
      return;
    }

    setErrors({});
    await onSubmit({
      title: validation.data.title,
      amount: validation.data.amount,
      type: validation.data.type,
      category: validation.data.category,
      paymentMethod: validation.data.paymentMethod,
      frequency: validation.data.frequency,
      startDate: validation.data.startDate,
      nextDate: validation.data.nextDate,
      endDate: validation.data.endDate,
      status: validation.data.status,
      autoCreate: validation.data.autoCreate,
      notes: validation.data.notes,
    });
  };

  const resolvedSubmitLabel =
    submitLabel || (isEditMode ? 'Update Schedule' : 'Create Schedule');

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

      {/* Expense / Income Segmented Switcher */}
      <div
        role="group"
        aria-label="Recurring transaction type"
        className="grid grid-cols-2 gap-2 rounded-xl border border-subtle bg-surface-elevated/60 p-1"
      >
        <button
          type="button"
          onClick={() => handleTypeSwitch('expense')}
          disabled={isSubmitting}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
            values.type === 'expense'
              ? 'bg-expense text-white shadow-sm'
              : 'text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <IconArrowDownRight className="h-4 w-4" stroke={2} />
          Expense
        </button>

        <button
          type="button"
          onClick={() => handleTypeSwitch('income')}
          disabled={isSubmitting}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
            values.type === 'income'
              ? 'bg-income text-canvas shadow-sm'
              : 'text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <IconArrowUpRight className="h-4 w-4" stroke={2} />
          Income
        </button>
      </div>

      {/* Title */}
      <Input
        label="Schedule Title"
        name="title"
        type="text"
        placeholder={
          values.type === 'expense'
            ? 'e.g., Apartment Rent, Fiber Broadband, Gym Membership'
            : 'e.g., Monthly Salary, Retainer Invoice'
        }
        value={values.title}
        onChange={handleFieldChange}
        error={errors.title}
        disabled={isSubmitting}
        leftIcon={<IconNotes className="h-4 w-4" stroke={1.75} />}
      />

      {/* Amount & Frequency Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min="1"
          step="any"
          placeholder="0.00"
          value={values.amount}
          onChange={handleFieldChange}
          error={errors.amount}
          disabled={isSubmitting}
          leftIcon={<IconCurrencyRupee className="h-4 w-4" stroke={1.75} />}
        />

        <SelectInput
          label="Frequency"
          name="frequency"
          value={values.frequency}
          onChange={handleFieldChange}
          options={FREQUENCY_OPTIONS}
          error={errors.frequency}
          disabled={isSubmitting}
          leftIcon={<IconRepeat className="h-4 w-4" stroke={1.75} />}
        />
      </div>

      {/* Category & Payment Method Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategorySelect
          label="Category"
          value={values.category}
          onChange={handleCategoryChange}
          categories={resolvedCategories}
          filterByType={values.type}
          error={errors.category}
          disabled={isSubmitting}
          onCreateCategory={() => {
            onCancel?.();
            navigate('/categories');
          }}
        />

        <SelectInput
          label="Payment Method"
          name="paymentMethod"
          value={values.paymentMethod}
          onChange={handleFieldChange}
          options={PAYMENT_METHOD_OPTIONS}
          error={errors.paymentMethod}
          disabled={isSubmitting}
          leftIcon={<IconCreditCard className="h-4 w-4" stroke={1.75} />}
        />
      </div>

      {/* Start Date & Next Occurrence Date Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Start Date"
          name="startDate"
          type="date"
          value={values.startDate}
          onChange={handleFieldChange}
          error={errors.startDate}
          disabled={isSubmitting}
          leftIcon={<IconCalendar className="h-4 w-4" stroke={1.75} />}
        />

        <Input
          label="Next Scheduled Date"
          name="nextDate"
          type="date"
          value={values.nextDate}
          onChange={handleFieldChange}
          error={errors.nextDate}
          disabled={isSubmitting}
          leftIcon={<IconCalendar className="h-4 w-4" stroke={1.75} />}
        />
      </div>

      {/* Optional End Date */}
      <Input
        label="End Date (Optional)"
        name="endDate"
        type="date"
        min={values.nextDate || undefined}
        value={values.endDate}
        onChange={handleFieldChange}
        error={errors.endDate}
        disabled={isSubmitting}
        leftIcon={<IconCalendar className="h-4 w-4" stroke={1.75} />}
      />

      {/* Auto-Create Toggle Card */}
      <label
        htmlFor="recurring-auto-create"
        className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-subtle bg-surface-elevated/45 p-3.5 transition-colors hover:bg-surface-elevated/70"
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <IconBolt className="h-4 w-4" stroke={1.75} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-ink-primary">
              Auto-log when due date arrives
            </span>
            <span className="mt-0.5 block text-[11px] text-ink-muted">
              Include this rule in one-click due processing to automatically add a transaction.
            </span>
          </div>
        </div>

        <input
          id="recurring-auto-create"
          type="checkbox"
          checked={values.autoCreate}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, autoCreate: e.target.checked }))
          }
          disabled={isSubmitting}
          className="mt-1 h-4 w-4 shrink-0 rounded border-subtle accent-brand"
        />
      </label>

      {/* Optional Notes */}
      <Input
        label="Notes (Optional)"
        name="notes"
        type="text"
        placeholder="Add billing reference, account info, or reminder..."
        value={values.notes}
        onChange={handleFieldChange}
        error={errors.notes}
        disabled={isSubmitting}
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
          variant={values.type === 'expense' ? 'primary' : 'secondary'}
          isLoading={isSubmitting}
          className="w-full sm:w-auto"
        >
          {resolvedSubmitLabel}
        </Button>
      </div>
    </form>
  );
}