import { useState, useEffect, type FormEvent } from 'react';
import {
  IconTargetArrow,
  IconShieldCheck,
  IconDeviceLaptop,
  IconPlane,
  IconHome,
  IconCar,
  IconSchool,
  IconPigMoney,
} from '@tabler/icons-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { SelectInput } from '../../../components/ui/SelectInput';
import { Button } from '../../../components/ui/Button';
import { useCategoriesContext } from '../../categories/context/CategoriesContext';
import {
  CategoryIcon,
  type CategoryColorToken,
} from '../../categories/components/CategoryIcon';
import { goalSchema } from '../schemas/goalSchema';
import type {
  GoalPayload,
  GoalPriority,
  SavingsGoal,
} from '../types/goal.types';

export interface GoalFormModalProps {
  isOpen: boolean;
  initialGoal?: SavingsGoal | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: GoalPayload) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: GoalPriority; label: string }[] = [
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low', label: 'Low Priority' },
];

const COLOR_OPTIONS: {
  value: CategoryColorToken;
  label: string;
  swatchClass: string;
}[] = [
  { value: 'brand', label: 'Brand', swatchClass: 'bg-brand' },
  { value: 'income', label: 'Emerald', swatchClass: 'bg-income' },
  { value: 'warning', label: 'Amber', swatchClass: 'bg-warning' },
  { value: 'expense', label: 'Coral', swatchClass: 'bg-expense' },
  { value: 'neutral', label: 'Slate', swatchClass: 'bg-ink-secondary' },
];

const GOAL_ICON_CHOICES = [
  { name: 'IconTargetArrow', label: 'Target', icon: IconTargetArrow },
  { name: 'IconShieldCheck', label: 'Emergency', icon: IconShieldCheck },
  { name: 'IconPigMoney', label: 'Savings', icon: IconPigMoney },
  { name: 'IconDeviceLaptop', label: 'Tech', icon: IconDeviceLaptop },
  { name: 'IconPlane', label: 'Travel', icon: IconPlane },
  { name: 'IconHome', label: 'Home', icon: IconHome },
  { name: 'IconCar', label: 'Vehicle', icon: IconCar },
  { name: 'IconSchool', label: 'Education', icon: IconSchool },
];

interface FormErrors {
  title?: string;
  category?: string;
  targetAmount?: string;
  currentAmount?: string;
  targetDate?: string;
  notes?: string;
}

export function GoalFormModal({
  isOpen,
  initialGoal = null,
  isSubmitting = false,
  onClose,
  onSubmit,
}: GoalFormModalProps) {
  const { categories } = useCategoriesContext();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Savings & Investments');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [color, setColor] = useState<CategoryColorToken>('brand');
  const [iconName, setIconName] = useState<string>('IconTargetArrow');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const isEditMode = Boolean(initialGoal);

  useEffect(() => {
    if (!isOpen) return;

    if (initialGoal) {
      setTitle(initialGoal.title);
      setCategory(initialGoal.category);
      setTargetAmount(String(initialGoal.targetAmount));
      setCurrentAmount(String(initialGoal.currentAmount));
      setTargetDate(initialGoal.targetDate ?? '');
      setPriority(initialGoal.priority);
      setColor(initialGoal.color);
      setIconName(initialGoal.iconName ?? 'IconTargetArrow');
      setNotes(initialGoal.notes ?? '');
    } else {
      const defaultCategory =
        categories.find((c) =>
          c.label.toLowerCase().includes('saving')
        )?.label ??
        categories[0]?.label ??
        'Savings & Investments';

      setTitle('');
      setCategory(defaultCategory);
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('');
      setPriority('medium');
      setColor('brand');
      setIconName('IconTargetArrow');
      setNotes('');
    }
    setErrors({});
  }, [isOpen, initialGoal, categories]);

  const categoryOptions =
    categories.length > 0
      ? categories.map((cat) => ({
          value: cat.label,
          label: cat.label,
        }))
      : [
          { value: 'Savings & Investments', label: 'Savings & Investments' },
          { value: 'Travel', label: 'Travel' },
          { value: 'Shopping', label: 'Shopping' },
          { value: 'Housing', label: 'Housing' },
          { value: 'Education', label: 'Education' },
        ];

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = goalSchema.safeParse({
      title,
      category,
      targetAmount: targetAmount === '' ? Number.NaN : Number(targetAmount),
      currentAmount: currentAmount === '' ? 0 : Number(currentAmount),
      targetDate: targetDate.trim() || undefined,
      priority,
      status: initialGoal?.status,
      color,
      iconName,
      notes: notes.trim() || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors | undefined;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    await onSubmit(parsed.data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Savings Goal' : 'Create Savings Goal'}
      description={
        isEditMode
          ? 'Update your target amount, deadline, or priority level.'
          : 'Set a clear target amount and timeline to track your savings progress.'
      }
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Live Visual Preview Header */}
        <div className="flex items-center gap-3 rounded-xl border border-subtle bg-surface-elevated/45 p-3">
          <CategoryIcon
            name={iconName}
            label={title || 'Goal'}
            type="income"
            color={color}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink-primary">
              {title.trim() || 'New Savings Goal'}
            </p>
            <p className="truncate text-xs text-ink-secondary">
              {category} •{' '}
              {PRIORITY_OPTIONS.find((p) => p.value === priority)?.label}
            </p>
          </div>
        </div>

        {/* Goal Title */}
        <Input
          label="Goal Title"
          placeholder="e.g., 6-Month Emergency Fund"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        {/* Target & Current Saved Amounts */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Target Amount"
            type="number"
            min="1"
            step="any"
            placeholder="100000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            error={errors.targetAmount}
            required
          />

          <Input
            label="Already Saved"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            error={errors.currentAmount}
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectInput
            label="Category"
            value={category}
            onChange={(e:any) => setCategory(e.target.value)}
            options={categoryOptions}
            error={errors.category}
          />

          <SelectInput
            label="Priority Level"
            value={priority}
            onChange={(e:any) => setPriority(e.target.value as GoalPriority)}
            options={PRIORITY_OPTIONS}
          />
        </div>

        {/* Target Deadline */}
        <Input
          label="Target Deadline (Optional)"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          error={errors.targetDate}
        />

        {/* Icon & Accent Color Picker */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Goal Icon
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {GOAL_ICON_CHOICES.map((choice) => {
                const IconComp = choice.icon;
                const isSelected = iconName === choice.name;
                return (
                  <button
                    key={choice.name}
                    type="button"
                    onClick={() => setIconName(choice.name)}
                    title={choice.label}
                    aria-label={choice.label}
                    className={`flex h-10 items-center justify-center rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-brand bg-brand/15 text-brand'
                        : 'border-subtle bg-surface-elevated/40 text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    <IconComp className="h-4.5 w-4.5" stroke={1.75} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Badge Color
            </span>
            <div className="flex h-10 items-center gap-2.5 rounded-xl border border-subtle bg-surface-elevated/40 px-3">
              {COLOR_OPTIONS.map((option) => {
                const isSelected = color === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColor(option.value)}
                    title={option.label}
                    aria-label={option.label}
                    className={`h-6 w-6 rounded-full transition-transform ${
                      option.swatchClass
                    } ${
                      isSelected
                        ? 'scale-110 ring-2 ring-ink-primary ring-offset-2 ring-offset-surface'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Optional Notes */}
        <Input
          label="Notes (Optional)"
          placeholder="Add motivation, account details, or milestones..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={errors.notes}
        />

        {/* Modal Actions */}
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
            {isSubmitting
              ? 'Saving...'
              : isEditMode
              ? 'Save Changes'
              : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}