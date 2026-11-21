import { z } from 'zod';
import type {
  RecurringFrequency,
  RecurringRuleStatus,
} from '../types/recurring.types';
const FREQUENCY_VALUES = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
] as const satisfies readonly RecurringFrequency[];

const STATUS_VALUES = [
  'active',
  'paused',
  'completed',
] as const satisfies readonly RecurringRuleStatus[];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const recurringSchema = z
  .object({
    title: z
      .string({ error: 'Schedule title is required.' })
      .trim()
      .min(2, 'Title must be at least 2 characters.')
      .max(80, 'Title cannot exceed 80 characters.'),

    amount: z
      .number({ error: 'Amount must be a valid number.' })
      .positive('Amount must be greater than 0.')
      .max(100_000_000, 'Amount is too large.'),

    type: z.enum(['expense', 'income'], {
      error: 'Please select expense or income.',
    }),

    category: z
      .string({ error: 'Please select a category.' })
      .trim()
      .min(1, 'Please select a category.'),

    paymentMethod: z
      .string({ error: 'Please select a payment method.' })
      .trim()
      .min(1, 'Please select a payment method.'),

    frequency: z.enum(FREQUENCY_VALUES, {
      error: 'Please select a valid frequency.',
    }),

    startDate: z
      .string({ error: 'Start date is required.' })
      .trim()
      .regex(DATE_PATTERN, 'Start date must be in YYYY-MM-DD format.'),

    nextDate: z
      .string({ error: 'Next occurrence date is required.' })
      .trim()
      .regex(DATE_PATTERN, 'Next date must be in YYYY-MM-DD format.'),

    endDate: z
      .string()
      .trim()
      .regex(DATE_PATTERN, 'End date must be in YYYY-MM-DD format.')
      .optional()
      .or(z.literal('')),

    status: z.enum(STATUS_VALUES).default('active'),

    autoCreate: z.boolean().default(true),

    notes: z
      .string()
      .trim()
      .max(200, 'Notes cannot exceed 200 characters.')
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      return data.endDate >= data.nextDate;
    },
    {
      message: 'End date cannot be earlier than the next scheduled date.',
      path: ['endDate'],
    }
  );

export type RecurringSchemaInput = z.input<typeof recurringSchema>;
export type RecurringSchemaOutput = z.output<typeof recurringSchema>;

export interface RecurringValidationResult {
  success: boolean;
  data?: RecurringSchemaOutput;
  fieldErrors: Partial<Record<keyof RecurringSchemaInput, string>>;
}

export function validateRecurringInput(
  input: unknown
): RecurringValidationResult {
  const parsed = recurringSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof RecurringSchemaInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof RecurringSchemaInput | undefined;
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      success: false,
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      ...parsed.data,
      endDate: parsed.data.endDate || undefined,
    },
    fieldErrors: {},
  };
}