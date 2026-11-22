import { apiRequest } from '../../../services/apiClient';
import { categoryService } from '../../categories/services/categoryService';
import type {
  BudgetItem,
  BudgetPayload,
  BudgetPeriod,
} from '../types/budget.types';

interface RawBudgetResponse {
  id?: string;
  _id?: string;
  category?: string;
  categoryId?: string | { _id?: string; id?: string; name?: string; label?: string };
  limit?: number | string;
  amount?: number | string;
  period?: BudgetPeriod;
  month?: number | string;
  year?: number | string;
  alertThreshold?: number | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getPreviousMonthString(monthString: string): string {
  const [yearStr, monthStr] = monthString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (Number.isNaN(year) || Number.isNaN(month)) {
    return getCurrentMonthString();
  }

  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
}

function parseMonthYear(monthString?: string): { month: number; year: number } {
  const now = new Date();
  const fallback = { month: now.getMonth() + 1, year: now.getFullYear() };

  if (!monthString) return fallback;

  const [yearStr, monthStr] = monthString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return fallback;
  }

  return { month, year };
}

function formatMonthYear(rawMonth?: number | string, rawYear?: number | string): string {
  if (typeof rawMonth === 'string' && /^\d{4}-\d{2}$/.test(rawMonth)) {
    return rawMonth;
  }

  const monthNum = Number(rawMonth);
  const yearNum = Number(rawYear) || new Date().getFullYear();

  if (Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12) {
    return `${yearNum}-${String(monthNum).padStart(2, '0')}`;
  }

  return getCurrentMonthString();
}

function extractCategoryName(
  ref?: string | { name?: string; label?: string } | null
): string | undefined {
  if (!ref || typeof ref === 'string') return undefined;
  return ref.label ?? ref.name;
}

function normalizeBudget(raw: RawBudgetResponse): BudgetItem {
  const parsedLimit = Number(raw.limit ?? raw.amount);
  const parsedThreshold = Number(raw.alertThreshold);
  const categoryName =
    extractCategoryName(raw.categoryId) ??
    (raw.category && !OBJECT_ID_REGEX.test(raw.category) ? raw.category : undefined) ??
    'Other Expense';

  return {
    id: String(raw.id ?? raw._id ?? ''),
    category: String(categoryName).trim(),
    limit: !Number.isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 0,
    period:
      raw.period === 'weekly' ||
      raw.period === 'yearly' ||
      raw.period === 'monthly'
        ? raw.period
        : 'monthly',
    month: formatMonthYear(raw.month, raw.year),
    alertThreshold:
      !Number.isNaN(parsedThreshold) &&
      parsedThreshold >= 50 &&
      parsedThreshold <= 100
        ? parsedThreshold
        : 80,
    notes: raw.notes ? String(raw.notes).trim() : undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

async function resolveBackendBudgetBody(payload: BudgetPayload) {
  const categoryName = payload.category.trim();
  let categoryId = OBJECT_ID_REGEX.test(categoryName)
    ? categoryName
    : undefined;

  if (!categoryId && categoryName) {
    const categories = await categoryService.getAll();
    const targetName = categoryName.toLowerCase();
    const matched =
      categories.find(
        (c) =>
          c.type === 'expense' &&
          (c.label.toLowerCase() === targetName || c.value.toLowerCase() === targetName)
      ) ??
      categories.find(
        (c) =>
          c.label.toLowerCase() === targetName || c.value.toLowerCase() === targetName
      );

    if (matched?.id && OBJECT_ID_REGEX.test(matched.id)) {
      categoryId = matched.id;
    } else {
      // Auto-create the category in MongoDB if it doesn't exist yet so categoryId is always valid
      const createdCategory = await categoryService.create({
        label: categoryName,
        type: 'expense',
        color: 'brand',
        iconName: 'IconCategory',
      });
      categoryId = createdCategory.id;
    }
  }

  const { month, year } = parseMonthYear(payload.month);
  const numericLimit = Number(payload.limit);
  const numericThreshold = Number(payload.alertThreshold);

  return {
    categoryId,
    category: categoryName,
    limit: numericLimit,
    amount: numericLimit,
    period: payload.period,
    month,
    year,
    ...(Number.isFinite(numericThreshold)
      ? { alertThreshold: numericThreshold }
      : {}),
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
  };
}

export const budgetService = {
  async getAll(monthString?: string): Promise<BudgetItem[]> {
    let query = '';
    if (monthString) {
      const { month, year } = parseMonthYear(monthString);
      query = `?month=${month}&year=${year}`;
    }

    const data = await apiRequest<
      { budgets?: RawBudgetResponse[]; data?: RawBudgetResponse[] } | RawBudgetResponse[]
    >(`/budgets${query}`);

    const list: RawBudgetResponse[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.budgets)
      ? data.budgets
      : Array.isArray(data?.data)
      ? data.data
      : [];

    return list.map(normalizeBudget);
  },

  async create(payload: BudgetPayload): Promise<BudgetItem> {
    const body = await resolveBackendBudgetBody(payload);
    const data = await apiRequest<
      { budget?: RawBudgetResponse; data?: RawBudgetResponse } & RawBudgetResponse
    >('/budgets', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const created: RawBudgetResponse = data?.budget ?? data?.data ?? data;
    return normalizeBudget({
      ...created,
      category: created.category ?? payload.category,
    });
  },

  async update(id: string, payload: BudgetPayload): Promise<BudgetItem> {
    const body = await resolveBackendBudgetBody(payload);
    const data = await apiRequest<
      { budget?: RawBudgetResponse; data?: RawBudgetResponse } & RawBudgetResponse
    >(`/budgets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...body,
        notes: payload.notes?.trim() || null,
      }),
    });

    const updated: RawBudgetResponse = data?.budget ?? data?.data ?? data;
    return normalizeBudget({
      ...updated,
      category: updated.category ?? payload.category,
    });
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/budgets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async copyFromPreviousMonth(targetMonth: string): Promise<BudgetItem[]> {
    const previousMonth = getPreviousMonthString(targetMonth);
    const previousBudgets = await this.getAll(previousMonth);

    if (previousBudgets.length === 0) {
      return [];
    }

    const existingTargetBudgets = await this.getAll(targetMonth);
    const existingCategories = new Set(
      existingTargetBudgets.map((b) => b.category.trim().toLowerCase())
    );

    const createdItems: BudgetItem[] = [];
    for (const prev of previousBudgets) {
      if (existingCategories.has(prev.category.trim().toLowerCase())) {
        continue;
      }

      const created = await this.create({
        category: prev.category,
        limit: prev.limit,
        period: prev.period,
        month: targetMonth,
        alertThreshold: prev.alertThreshold,
        notes: prev.notes,
      });
      createdItems.push(created);
    }

    return createdItems;
  },
};