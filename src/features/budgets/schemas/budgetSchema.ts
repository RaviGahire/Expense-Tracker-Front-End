import { z } from 'zod';
import type { BudgetItem, BudgetPeriod } from '../types/budget.types';

const BUDGET_PERIOD_VALUES = [
  'monthly',
  'weekly',
  'yearly',
] as const satisfies readonly BudgetPeriod[];

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export const budgetSchema = z.object({
  category: z
    .string({ error: 'Please select an expense category.' })
    .trim()
    .min(1, 'Please select an expense category.'),

  limit: z
    .number({ error: 'Budget limit must be a valid number.' })
    .positive('Budget limit must be greater than 0.')
    .max(100_000_000, 'Budget limit is too large.'),

  period: z
    .enum(BUDGET_PERIOD_VALUES, {
      error: 'Please select a valid budget period.',
    })
    .default('monthly'),

  month: z
    .string({ error: 'Budget month is required.' })
    .trim()
    .regex(MONTH_PATTERN, 'Month must be in YYYY-MM format.'),

  alertThreshold: z
    .number({ error: 'Alert threshold must be a number.' })
    .min(50, 'Alert threshold must be at least 50%.')
    .max(100, 'Alert threshold cannot exceed 100%.')
    .default(80),

  notes: z
    .string()
    .trim()
    .max(200, 'Notes cannot exceed 200 characters.')
    .optional(),
});

export type BudgetSchemaInput = z.input<typeof budgetSchema>;
export type BudgetSchemaOutput = z.output<typeof budgetSchema>;

export interface BudgetValidationResult {
  success: boolean;
  data?: BudgetSchemaOutput;
  fieldErrors: Partial<Record<keyof BudgetSchemaInput, string>>;
}

export function validateBudgetInput(
  input: unknown,
  existingBudgets: BudgetItem[] = [],
  editingBudgetId?: string
): BudgetValidationResult {
  const parsed = budgetSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof BudgetSchemaInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof BudgetSchemaInput | undefined;
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      success: false,
      fieldErrors,
    };
  }

  // Prevent duplicate budget for the same category in the same month
  const normalizedCategory = parsed.data.category.trim().toLowerCase();
  const isDuplicate = existingBudgets.some(
    (item) =>
      item.id !== editingBudgetId &&
      item.month === parsed.data.month &&
      item.category.trim().toLowerCase() === normalizedCategory
  );

  if (isDuplicate) {
    return {
      success: false,
      fieldErrors: {
        category: `A budget for "${parsed.data.category}" already exists for ${parsed.data.month}.`,
      },
    };
  }

  return {
    success: true,
    data: parsed.data,
    fieldErrors: {},
  };
}