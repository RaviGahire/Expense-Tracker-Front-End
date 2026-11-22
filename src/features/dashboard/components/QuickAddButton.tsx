import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  IconPlus,
  IconArrowDownRight,
  IconArrowUpRight,
  IconCurrencyRupee,
  IconTag,
  IconCalendar,
  IconCreditCard,
  IconNotes,
} from '@tabler/icons-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { SelectInput } from '../../../components/ui/SelectInput';
import { getTodayDateString } from '../../../utils';
import type { TransactionType } from '../types/TransactionType';


export interface QuickTransactionPayload {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  date: string;
  notes?: string;
}

export interface QuickAddButtonProps {
  onAddTransaction?: (payload: QuickTransactionPayload) => Promise<void> | void;
  currency?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface FormState {
  title: string;
  amount: string;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  date: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EXPENSE_CATEGORIES = [
  { value: 'Food & Dining', label: 'Food & Dining' },
  { value: 'Housing & Rent', label: 'Housing & Rent' },
  { value: 'Transport & Fuel', label: 'Transport & Fuel' },
  { value: 'Bills & Utilities', label: 'Bills & Utilities' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Health & Medical', label: 'Health & Medical' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Other Expense', label: 'Other Expense' },
];

const INCOME_CATEGORIES = [
  { value: 'Salary', label: 'Salary' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Investments', label: 'Investments' },
  { value: 'Bonus & Gifts', label: 'Bonus & Gifts' },
  { value: 'Other Income', label: 'Other Income' },
];

const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'Debit Card', label: 'Debit Card' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Cash', label: 'Cash' },
];


export const  QuickAddButton = ({
  onAddTransaction,
  currency = 'INR',
  label = 'Quick Add',
  size = 'md',
  className = '',
}: QuickAddButtonProps) => {
    
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [values, setValues] = useState<FormState>({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'UPI',
    date: getTodayDateString(),
    notes: '',
  });

  const resetForm = (nextType: TransactionType = 'expense') => {
    setValues({
      title: '',
      amount: '',
      type: nextType,
      category:
        nextType === 'expense'
          ? EXPENSE_CATEGORIES[0].value
          : INCOME_CATEGORIES[0].value,
      paymentMethod: 'UPI',
      date: getTodayDateString(),
      notes: '',
    });
    setErrors({});
  };

  const handleOpen = () => {
    resetForm('expense');
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleTypeSwitch = (nextType: TransactionType) => {
    if (values.type === nextType) return;
    setValues((prev) => ({
      ...prev,
      type: nextType,
      category:
        nextType === 'expense'
          ? EXPENSE_CATEGORIES[0].value
          : INCOME_CATEGORIES[0].value,
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

    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const numericAmount = Number(values.amount);

    if (!values.title.trim()) {
      nextErrors.title = 'Please enter a title or merchant name.';
    }

    if (!values.amount.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      nextErrors.amount = 'Enter a valid amount greater than 0.';
    }

    if (!values.category) {
      nextErrors.category = 'Please select a category.';
    }

    if (!values.date) {
      nextErrors.date = 'Please select a date.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: QuickTransactionPayload = {
      title: values.title.trim(),
      amount: Number(values.amount),
      type: values.type,
      category: values.category,
      paymentMethod: values.paymentMethod,
      date: values.date,
      notes: values.notes.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      if (onAddTransaction) {
        await onAddTransaction(payload);
      } else {
        console.log('Quick transaction recorded:', payload);
      }
      setIsOpen(false);
      resetForm('expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions =
    values.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <>
      <Button
        size={size}
        onClick={handleOpen}
        leftIcon={<IconPlus className="h-4 w-4" stroke={2.25} />}
        className={className}
      >
        {label}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Quick Add Transaction"
        description="Record a new expense or income entry in seconds."
        // size="md"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Type Switcher (Expense vs Income) */}
          <div
            role="group"
            aria-label="Transaction type"
            className="grid grid-cols-2 gap-2 rounded-xl border border-subtle bg-surface-elevated/60 p-1"
          >
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              disabled={isSubmitting}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
              className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
              label={`Amount (${currency})`}
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

          {/* Title / Description */}
          <Input
            label="Title"
            name="title"
            type="text"
            placeholder={
              values.type === 'expense'
                ? 'e.g., Grocery Store, Metro Pass, Coffee'
                : 'e.g., Monthly Salary, Client Invoice'
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
              options={PAYMENT_METHODS}
              disabled={isSubmitting}
              leftIcon={<IconCreditCard className="h-4 w-4" stroke={1.75} />}
            />
          </div>

          {/* Optional Note */}
          <Input
            label="Notes (Optional)"
            name="notes"
            type="text"
            placeholder="Add a short reference note..."
            value={values.notes}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-2.5 border-t border-subtle pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={values.type === 'expense' ? 'primary' : 'secondary'}
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
            >
              {values.type === 'expense' ? 'Save Expense' : 'Save Income'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}