import { useEffect, type ChangeEvent } from 'react';
import {
  IconRepeat,
  IconCalendarRepeat,
  IconCalendarOff,
} from '@tabler/icons-react';
import { SelectInput } from '../../../components/ui/SelectInput';
import { Input } from '../../../components/ui/Input';
import type { RecurringFrequency } from '../types/types';


export interface RecurringConfig {
  isRecurring: boolean;
  frequency: RecurringFrequency;
  nextDate: string;
  endDate?: string;
}

export interface RecurringFieldsProps {
  value: RecurringConfig;
  baseDate: string;
  onChange: (nextValue: RecurringConfig) => void;
  disabled?: boolean;
  nextDateError?: string;
  endDateError?: string;
}

export const RECURRING_FREQUENCY_OPTIONS: {
  value: RecurringFrequency;
  label: string;
}[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (Every 3 Months)' },
  { value: 'yearly', label: 'Yearly' },
];

export function calculateNextOccurrenceDate(
  baseDateString: string,
  frequency: RecurringFrequency
): string {
  const parsed = baseDateString
    ? new Date(`${baseDateString}T00:00:00`)
    : new Date();

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  const next = new Date(parsed);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function RecurringFields({
  value,
  baseDate,
  onChange,
  disabled = false,
  nextDateError,
  endDateError,
}: RecurringFieldsProps) {
  // Keep nextDate synchronized when baseDate or frequency changes while recurring is active
  useEffect(() => {
    if (!value.isRecurring) return;
    const computedNext = calculateNextOccurrenceDate(baseDate, value.frequency);
    if (computedNext !== value.nextDate) {
      onChange({
        ...value,
        nextDate: computedNext,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseDate, value.frequency, value.isRecurring]);

  const handleToggle = () => {
    if (disabled) return;
    const nextIsRecurring = !value.isRecurring;

    onChange({
      ...value,
      isRecurring: nextIsRecurring,
      nextDate: nextIsRecurring
        ? value.nextDate || calculateNextOccurrenceDate(baseDate, value.frequency)
        : value.nextDate,
    });
  };

  const handleFrequencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextFrequency = e.target.value as RecurringFrequency;
    onChange({
      ...value,
      frequency: nextFrequency,
      nextDate: calculateNextOccurrenceDate(baseDate, nextFrequency),
    });
  };

  const handleNextDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      nextDate: e.target.value,
    });
  };

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      endDate: e.target.value || undefined,
    });
  };

  return (
    <div className="rounded-xl border border-subtle bg-surface-elevated/40 p-4 transition-colors">
      {/* Header Row with Toggle Switch */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
              value.isRecurring
                ? 'bg-brand/15 text-brand'
                : 'bg-surface-elevated text-ink-muted'
            }`}
          >
            <IconRepeat className="h-4 w-4" stroke={1.75} />
          </div>

          <div>
            <label
              htmlFor="recurring-toggle"
              onClick={handleToggle}
              className="cursor-pointer text-sm font-semibold text-ink-primary select-none"
            >
              Recurring Transaction
            </label>
            <p className="text-xs text-ink-secondary">
              Automatically repeat this entry on a schedule
            </p>
          </div>
        </div>

        <button
          id="recurring-toggle"
          type="button"
          role="switch"
          aria-checked={value.isRecurring}
          aria-label="Toggle recurring transaction"
          disabled={disabled}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-50 ${
            value.isRecurring
              ? 'border-brand bg-brand'
              : 'border-subtle bg-surface-elevated'
          }`}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
              value.isRecurring ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Expanded Schedule Fields */}
      {value.isRecurring && (
        <div className="mt-4 space-y-4 border-t border-subtle pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectInput
              label="Repeat Frequency"
              name="recurringFrequency"
              value={value.frequency}
              onChange={handleFrequencyChange}
              options={RECURRING_FREQUENCY_OPTIONS}
              disabled={disabled}
              leftIcon={<IconRepeat className="h-4 w-4" stroke={1.75} />}
            />

            <Input
              label="Next Scheduled Date"
              name="recurringNextDate"
              type="date"
              min={baseDate}
              value={value.nextDate}
              onChange={handleNextDateChange}
              error={nextDateError}
              disabled={disabled}
              leftIcon={
                <IconCalendarRepeat className="h-4 w-4" stroke={1.75} />
              }
            />
          </div>

          <Input
            label="End Date (Optional)"
            name="recurringEndDate"
            type="date"
            min={value.nextDate || baseDate}
            value={value.endDate || ''}
            onChange={handleEndDateChange}
            error={endDateError}
            disabled={disabled}
            helperText="Leave blank to continue repeating until manually paused."
            leftIcon={<IconCalendarOff className="h-4 w-4" stroke={1.75} />}
          />
        </div>
      )}
    </div>
  );
}