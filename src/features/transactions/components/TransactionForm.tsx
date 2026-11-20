import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCurrencyRupee,
  IconTag,
  IconCalendar,
  IconCreditCard,
  IconNotes,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Input } from '../../../components/ui/Input';
import { SelectInput } from '../../../components/ui/SelectInput';
import { Button } from '../../../components/ui/Button';
import {
  RecurringFields,
  calculateNextOccurrenceDate,
  type RecurringConfig,
} from './RecurringFields';
import {
  AttachmentUpload,
  type ExistingAttachment,
} from './AttachmentUpload';

export type TransactionFormType = 'expense' | 'income';

export interface TransactionFormValues {
  title: string;
  amount: number;
  type: TransactionFormType;
  category: string;
  paymentMethod: string;
  date: string;
  notes?: string;
  recurring?: RecurringConfig;
  attachment?: File | null;
  removeExistingAttachment?: boolean;
}

export interface TransactionFormProps {
  initialValues?: Partial<TransactionFormValues>;
  existingAttachment?: ExistingAttachment | null;
  onSubmit: (values: TransactionFormValues) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  submitLabel?: string;
}

interface InternalFormState {
  title: string;
  amount: string;
  type: TransactionFormType;
  category: string;
  paymentMethod: string;
  date: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof InternalFormState, string>>;

export const EXPENSE_CATEGORIES = [
  { value: 'Food & Dining', label: 'Food & Dining' },
  { value: 'Housing & Rent', label: 'Housing & Rent' },
  { value: 'Transport & Fuel', label: 'Transport & Fuel' },
  { value: 'Bills & Utilities', label: 'Bills & Utilities' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Health & Medical', label: 'Health & Medical' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Education', label: 'Education' },
  { value: 'Other Expense', label: 'Other Expense' },
];

export const INCOME_CATEGORIES = [
  { value: 'Salary', label: 'Salary' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Investments', label: 'Investments' },
  { value: 'Bonus & Gifts', label: 'Bonus & Gifts' },
  { value: 'Refunds', label: 'Refunds' },
  { value: 'Other Income', label: 'Other Income' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'Debit Card', label: 'Debit Card' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Net Banking', label: 'Net Banking' },
];

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDefaultCategory(type: TransactionFormType): string {
  return type === 'expense'
    ? EXPENSE_CATEGORIES[0].value
    : INCOME_CATEGORIES[0].value;
}

function buildInitialState(
  initialValues?: Partial<TransactionFormValues>
): InternalFormState {
  const resolvedType: TransactionFormType = initialValues?.type || 'expense';
  return {
    title: initialValues?.title ?? '',
    amount:
      typeof initialValues?.amount === 'number' && initialValues.amount > 0
        ? String(initialValues.amount)
        : '',
    type: resolvedType,
    category: initialValues?.category || getDefaultCategory(resolvedType),
    paymentMethod: initialValues?.paymentMethod || PAYMENT_METHOD_OPTIONS[0].value,
    date: initialValues?.date || getTodayDateString(),
    notes: initialValues?.notes ?? '',
  };
}

function buildInitialRecurring(
  initialValues?: Partial<TransactionFormValues>
): RecurringConfig {
  const baseDate = initialValues?.date || getTodayDateString();
  const frequency = initialValues?.recurring?.frequency ?? 'monthly';

  return {
    isRecurring: initialValues?.recurring?.isRecurring ?? false,
    frequency,
    nextDate:
      initialValues?.recurring?.nextDate ??
      calculateNextOccurrenceDate(baseDate, frequency),
    endDate: initialValues?.recurring?.endDate,
  };
}

export function TransactionForm({
  initialValues,
  existingAttachment = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError = null,
  submitLabel,
}: TransactionFormProps) {
  const [values, setValues] = useState<InternalFormState>(() =>
    buildInitialState(initialValues)
  );
  const [recurring, setRecurring] = useState<RecurringConfig>(() =>
    buildInitialRecurring(initialValues)
  );
  const [attachment, setAttachment] = useState<File | null>(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] =
    useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Sync form state whenever initialValues changes (e.g. switching between Edit rows)
  useEffect(() => {
    setValues(buildInitialState(initialValues));
    setRecurring(buildInitialRecurring(initialValues));
    setAttachment(null);
    setRemoveExistingAttachment(false);
    setErrors({});
  }, [initialValues]);

  const isEditMode = Boolean(initialValues?.title);

  const handleTypeSwitch = (nextType: TransactionFormType) => {
    if (values.type === nextType || isSubmitting) return;

    const validCategories =
      nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const isCurrentCategoryValid = validCategories.some(
      (cat) => cat.value === values.category
    );

    setValues((prev) => ({
      ...prev,
      type: nextType,
      category: isCurrentCategoryValid
        ? prev.category
        : getDefaultCategory(nextType),
    }));

    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof InternalFormState]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const parsedAmount = Number(values.amount);

    if (!values.title.trim()) {
      nextErrors.title = 'Transaction title is required.';
    } else if (values.title.trim().length < 2) {
      nextErrors.title = 'Title must be at least 2 characters.';
    }

    if (!values.amount.trim()) {
      nextErrors.amount = 'Amount is required.';
    } else if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Enter a valid amount greater than 0.';
    }

    if (!values.category) {
      nextErrors.category = 'Please select a category.';
    }

    if (!values.paymentMethod) {
      nextErrors.paymentMethod = 'Please select a payment method.';
    }

    if (!values.date) {
      nextErrors.date = 'Transaction date is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    const payload: TransactionFormValues = {
      title: values.title.trim(),
      amount: Number(values.amount),
      type: values.type,
      category: values.category,
      paymentMethod: values.paymentMethod,
      date: values.date,
      notes: values.notes.trim() || undefined,
      recurring: recurring.isRecurring ? recurring : undefined,
      attachment,
      removeExistingAttachment,
    };

    await onSubmit(payload);
  };

  const categoryOptions =
    values.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const resolvedSubmitLabel =
    submitLabel ||
    (isEditMode
      ? 'Update Transaction'
      : values.type === 'expense'
      ? 'Add Expense'
      : 'Add Income');

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

      {/* Transaction Type Segmented Switcher */}
      <div
        role="group"
        aria-label="Transaction type"
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

      {/* Amount & Date Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="any"
          placeholder="0.00"
          value={values.amount}
          onChange={handleChange}
          error={errors.amount}
          disabled={isSubmitting}
          leftIcon={<IconCurrencyRupee className="h-4 w-4" stroke={1.75} />}
        />

        <Input
          label="Date"
          name="date"
          type="date"
          value={values.date}
          onChange={handleChange}
          error={errors.date}
          disabled={isSubmitting}
          leftIcon={<IconCalendar className="h-4 w-4" stroke={1.75} />}
        />
      </div>

      {/* Title */}
      <Input
        label="Title"
        name="title"
        type="text"
        placeholder={
          values.type === 'expense'
            ? 'e.g., Supermarket Groceries, Electricity Bill'
            : 'e.g., Monthly Salary, Freelance Project'
        }
        value={values.title}
        onChange={handleChange}
        error={errors.title}
        disabled={isSubmitting}
        leftIcon={<IconNotes className="h-4 w-4" stroke={1.75} />}
      />

      {/* Category & Payment Method Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectInput
          label="Category"
          name="category"
          value={values.category}
          onChange={handleChange}
          options={categoryOptions}
          error={errors.category}
          disabled={isSubmitting}
          leftIcon={<IconTag className="h-4 w-4" stroke={1.75} />}
        />

        <SelectInput
          label="Payment Method"
          name="paymentMethod"
          value={values.paymentMethod}
          onChange={handleChange}
          options={PAYMENT_METHOD_OPTIONS}
          error={errors.paymentMethod}
          disabled={isSubmitting}
          leftIcon={<IconCreditCard className="h-4 w-4" stroke={1.75} />}
        />
      </div>

      {/* Optional Notes */}
      <Input
        label="Notes (Optional)"
        name="notes"
        type="text"
        placeholder="Add any extra context or invoice reference..."
        value={values.notes}
        onChange={handleChange}
        disabled={isSubmitting}
      />

      {/* Recurring Schedule Fields */}
      <RecurringFields
        value={recurring}
        baseDate={values.date}
        onChange={setRecurring}
        disabled={isSubmitting}
      />

      {/* Receipt / Invoice Attachment Upload */}
      <AttachmentUpload
        file={attachment}
        onChange={(nextFile) => {
          setAttachment(nextFile);
          if (nextFile) {
            setRemoveExistingAttachment(false);
          }
        }}
        existingAttachment={
          removeExistingAttachment ? null : existingAttachment
        }
        onRemoveExisting={() => setRemoveExistingAttachment(true)}
        disabled={isSubmitting}
      />

      {/* Footer Buttons */}
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