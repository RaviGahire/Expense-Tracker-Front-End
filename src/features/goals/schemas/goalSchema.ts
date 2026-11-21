import { z } from 'zod';
import type { CategoryColorToken } from '../../categories/components/CategoryIcon';
import type { GoalPriority, GoalStatus } from '../types/goal.types';

const PRIORITY_VALUES = ['low', 'medium', 'high'] as const satisfies readonly GoalPriority[];
const STATUS_VALUES = ['active', 'completed', 'paused'] as const satisfies readonly GoalStatus[];

const COLOR_VALUES = [
"brand" , "income" , "expense" , "warning" , "accent" , "neutral"

] as const satisfies readonly CategoryColorToken[];

export const goalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Goal title must be at least 2 characters')
    .max(60, 'Goal title cannot exceed 60 characters'),
  category: z.string().trim().min(1, 'Please select a category'),
  targetAmount: z
    .number({ error: 'Enter a valid target amount' })
    .positive('Target amount must be greater than 0'),
  currentAmount: z
    .number({ error: 'Enter a valid saved amount' })
    .min(0, 'Saved amount cannot be negative'),
  targetDate: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Target date must be in YYYY-MM-DD format'
    ),
  priority: z.enum(PRIORITY_VALUES),
  status: z.enum(STATUS_VALUES).optional(),
  color: z.enum(COLOR_VALUES),
  iconName: z.string().trim().optional(),
  notes: z.string().trim().max(240, 'Notes cannot exceed 240 characters').optional(),
});

export type GoalFormSchemaValues = z.infer<typeof goalSchema>;

export const contributionSchema = z.object({
  amount: z
    .number({error: 'Enter a valid amount' })
    .positive('Contribution must be greater than 0'),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date'),
  note: z.string().trim().max(140, 'Note cannot exceed 140 characters').optional(),
  recordAsTransaction: z.boolean().optional(),
});

export type ContributionFormSchemaValues = z.infer<typeof contributionSchema>;