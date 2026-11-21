import { z } from 'zod';
import {
  CATEGORY_ICON_MAP,
  type CategoryIconKey,
} from '../constants/categoryIcons';
import type {
  CategoryColorToken,
  CategoryFlowType,
  CategoryOptionItem,
} from '../components/CategorySelect';

const CATEGORY_FLOW_VALUES = ['expense', 'income'] as const satisfies readonly CategoryFlowType[];

const CATEGORY_COLOR_VALUES = [
  'brand',
  'income',
  'expense',
  'warning',
  'accent',
  'neutral',
] as const satisfies readonly CategoryColorToken[];

const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICON_MAP) as [
  CategoryIconKey,
  ...CategoryIconKey[],
];

export const categorySchema = z.object({
  label: z
    .string({ error: 'Category name is required.' })
    .trim()
    .min(2, 'Category name must be at least 2 characters.')
    .max(40, 'Category name cannot exceed 40 characters.')
    .refine((val) => val.toLowerCase() !== 'all', {
      message: '"All" is reserved and cannot be used as a category name.',
    }),

  type: z.enum(CATEGORY_FLOW_VALUES, {
    error: 'Category type must be either expense or income.',
  }),

  color: z.enum(CATEGORY_COLOR_VALUES, {
    error: 'Please select a valid theme color badge.',
  }),

  iconName: z
    .enum(CATEGORY_ICON_KEYS, {
      error: 'Please select a valid category icon.',
    })
    .default('category'),
});

export type CategorySchemaInput = z.input<typeof categorySchema>;
export type CategorySchemaOutput = z.output<typeof categorySchema>;

export interface CategoryValidationResult {
  success: boolean;
  data?: CategorySchemaOutput;
  fieldErrors: Partial<Record<keyof CategorySchemaInput, string>>;
}

export function validateCategoryInput(
  input: unknown,
  existingCategories: CategoryOptionItem[] = [],
  editingCategoryId?: string
): CategoryValidationResult {
  const parsed = categorySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof CategorySchemaInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof CategorySchemaInput | undefined;
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      success: false,
      fieldErrors,
    };
  }

  const normalizedLabel = parsed.data.label.trim().toLowerCase();
  const isDuplicate = existingCategories.some(
    (item) =>
      item.id !== editingCategoryId &&
      item.type === parsed.data.type &&
      item.label.trim().toLowerCase() === normalizedLabel
  );

  if (isDuplicate) {
    return {
      success: false,
      fieldErrors: {
        label: `A ${parsed.data.type} category named "${parsed.data.label}" already exists.`,
      },
    };
  }

  return {
    success: true,
    data: parsed.data,
    fieldErrors: {},
  };
}