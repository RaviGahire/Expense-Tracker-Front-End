import { z } from 'zod';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHOD_OPTIONS,
} from '../components/TransactionForm';
import { RECURRING_FREQUENCY_OPTIONS } from '../components/RecurringFields';
import {
  DEFAULT_ACCEPTED_MIME_TYPES,
  DEFAULT_MAX_ATTACHMENT_MB,
} from '../components/AttachmentUpload';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const EXPENSE_CATEGORY_VALUES = EXPENSE_CATEGORIES.map((c) => c.value);
const INCOME_CATEGORY_VALUES = INCOME_CATEGORIES.map((c) => c.value);
const ALL_CATEGORY_VALUES = [
  ...EXPENSE_CATEGORY_VALUES,
  ...INCOME_CATEGORY_VALUES,
] as [string, ...string[]];

const PAYMENT_METHOD_VALUES = PAYMENT_METHOD_OPTIONS.map((p) => p.value) as [
  string,
  ...string[],
];

const FREQUENCY_VALUES = RECURRING_FREQUENCY_OPTIONS.map((f) => f.value) as [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
];

const MAX_ATTACHMENT_BYTES = DEFAULT_MAX_ATTACHMENT_MB * 1024 * 1024;

export const recurringConfigSchema = z.object({
  isRecurring: z.boolean(),
  frequency: z.enum(FREQUENCY_VALUES, {
    error: 'Please select a valid repeat frequency.',
  }),
  nextDate: z
    .string()
    .regex(ISO_DATE_REGEX, 'Next scheduled date must be in YYYY-MM-DD format.')
    .optional()
    .or(z.literal('')),
  endDate: z
    .string()
    .regex(ISO_DATE_REGEX, 'End date must be in YYYY-MM-DD format.')
    .optional()
    .or(z.literal('')),
});

export const attachmentFileSchema = z
  .custom<File | null | undefined>(
    (val) => val === null || val === undefined || val instanceof File,
    { message: 'Invalid file attachment.' }
  )
  .refine(
    (file) => {
      if (!file) return true;
      return DEFAULT_ACCEPTED_MIME_TYPES.includes(file.type);
    },
    {
      message:
        'Unsupported file type. Only JPG, PNG, WebP, or PDF files are allowed.',
    }
  )
  .refine(
    (file) => {
      if (!file) return true;
      return file.size <= MAX_ATTACHMENT_BYTES;
    },
    {
      message: `Attachment size must not exceed ${DEFAULT_MAX_ATTACHMENT_MB} MB.`,
    }
  );

export const transactionSchema = z
  .object({
    title: z
      .string({ error: 'Transaction title is required.' })
      .trim()
      .min(2, 'Title must be at least 2 characters.')
      .max(120, 'Title cannot exceed 120 characters.'),

    amount: z.coerce
      .number({ error: 'Amount must be a valid number.' })
      .positive('Amount must be greater than 0.')
      .max(100_000_000, 'Amount exceeds maximum allowed limit.'),

    type: z.enum(['expense', 'income'], {
      error: 'Transaction type must be either expense or income.',
    }),

    category: z.enum(ALL_CATEGORY_VALUES, {
      error: 'Please select a valid category.',
    }),

    paymentMethod: z.enum(PAYMENT_METHOD_VALUES, {
      error: 'Please select a valid payment method.',
    }),

    date: z
      .string({ error: 'Transaction date is required.' })
      .regex(ISO_DATE_REGEX, 'Date must be in YYYY-MM-DD format.'),

    notes: z
      .string()
      .trim()
      .max(500, 'Notes cannot exceed 500 characters.')
      .optional()
      .or(z.literal('')),

    recurring: recurringConfigSchema.optional(),

    attachment: attachmentFileSchema.optional(),

    removeExistingAttachment: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // 1. Ensure category belongs to the chosen transaction type
    const allowedCategories =
      data.type === 'expense' ? EXPENSE_CATEGORY_VALUES : INCOME_CATEGORY_VALUES;

    if (!allowedCategories.includes(data.category)) {
      ctx.addIssue({
        code: 'custom',
        path: ['category'],
        message: `Selected category is not valid for ${data.type} transactions.`,
      });
    }

    // 2. Enforce recurring schedule date rules when recurring is toggled ON
    if (data.recurring?.isRecurring) {
      if (!data.recurring.nextDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['recurring', 'nextDate'],
          message: 'Next scheduled date is required for recurring entries.',
        });
      } else if (data.recurring.nextDate < data.date) {
        ctx.addIssue({
          code: 'custom',
          path: ['recurring', 'nextDate'],
          message:
            'Next scheduled date cannot be earlier than the transaction date.',
        });
      }

      if (
        data.recurring.endDate &&
        data.recurring.nextDate &&
        data.recurring.endDate < data.recurring.nextDate
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['recurring', 'endDate'],
          message: 'End date cannot be earlier than the next scheduled date.',
        });
      }
    }
  });

export type TransactionSchemaInput = z.input<typeof transactionSchema>;
export type TransactionSchemaOutput = z.output<typeof transactionSchema>;

export interface TransactionValidationResult {
  success: boolean;
  data?: TransactionSchemaOutput;
  fieldErrors: Record<string, string>;
}

export function validateTransactionInput(
  input: unknown
): TransactionValidationResult {
  const result = transactionSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      fieldErrors: {},
    };
  }

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return {
    success: false,
    fieldErrors,
  };
}