import { z } from 'zod';
import type { CategoryColorToken } from '../../categories/components/CategoryIcon';
import type { AccountType } from '../types/account.types';

const ACCOUNT_TYPES = [
  'cash',
  'bank',
  'credit_card',
  'wallet',
  'savings',
] as const satisfies readonly AccountType[];

const COLOR_VALUES = [
  'brand',
  'income',
  'expense',
  'warning',
  'neutral',
] as const satisfies readonly CategoryColorToken[];

export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Account name must be at least 2 characters')
    .max(50, 'Account name cannot exceed 50 characters'),
  type: z.enum(ACCOUNT_TYPES),
  balance: z.number({ error: 'Enter a valid balance' }),
  creditLimit: z
    .number({ error: 'Enter a valid credit limit' })
    .min(0, 'Credit limit cannot be negative')
    .optional(),
  institution: z
    .string()
    .trim()
    .max(50, 'Institution name cannot exceed 50 characters')
    .optional(),
  accountNumberLast4: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^\d{4}$/.test(val),
      'Enter exactly 4 digits'
    )
    .optional(),
  color: z.enum(COLOR_VALUES),
  iconName: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
  notes: z
    .string()
    .trim()
    .max(200, 'Notes cannot exceed 200 characters')
    .optional(),
});

export type AccountFormSchemaValues = z.infer<typeof accountSchema>;

export const transferSchema = z
  .object({
    fromAccountId: z.string().trim().min(1, 'Select a source account'),
    toAccountId: z.string().trim().min(1, 'Select a destination account'),
    amount: z
      .number({ error: 'Enter a valid transfer amount' })
      .positive('Transfer amount must be greater than 0'),
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date'),
    note: z.string().trim().max(140, 'Note cannot exceed 140 characters').optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'Source and destination accounts must be different',
    path: ['toAccountId'],
  });

export type TransferFormSchemaValues = z.infer<typeof transferSchema>;