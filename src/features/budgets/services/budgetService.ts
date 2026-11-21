import type {
  BudgetItem,
  BudgetPayload,
  BudgetPeriod,
} from '../types/budget.types';

const STORAGE_KEY = 'fintrack_budgets_v1';
const TOKEN_STORAGE_KEY = 'fintrack_auth_token';
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

interface RawBudgetResponse {
  id?: string;
  _id?: string;
  category?: string;
  limit?: number | string;
  period?: BudgetPeriod;
  month?: string;
  alertThreshold?: number | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

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

function generateLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `budget_${crypto.randomUUID()}`;
  }
  return `budget_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeBudget(raw: RawBudgetResponse): BudgetItem {
  const parsedLimit = Number(raw.limit);
  const parsedThreshold = Number(raw.alertThreshold);

  return {
    id: String(raw.id ?? raw._id ?? generateLocalId()),
    category: String(raw.category ?? 'Other Expense').trim(),
    limit: !Number.isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 0,
    period:
      raw.period === 'weekly' ||
      raw.period === 'yearly' ||
      raw.period === 'monthly'
        ? raw.period
        : 'monthly',
    month: String(raw.month ?? getCurrentMonthString()),
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

function buildSeedBudgets(month: string): BudgetItem[] {
  const nowIso = new Date().toISOString();

  return [
    {
      id: 'seed_budget_food',
      category: 'Food & Dining',
      limit: 8000,
      period: 'monthly',
      month,
      alertThreshold: 80,
      notes: 'Groceries, dining out, and daily tea/coffee',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_budget_housing',
      category: 'Housing & Rent',
      limit: 18000,
      period: 'monthly',
      month,
      alertThreshold: 90,
      notes: 'Monthly apartment rent and society maintenance',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_budget_transport',
      category: 'Transport & Fuel',
      limit: 3500,
      period: 'monthly',
      month,
      alertThreshold: 80,
      notes: 'Fuel, metro pass, and cab rides',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_budget_bills',
      category: 'Bills & Utilities',
      limit: 4000,
      period: 'monthly',
      month,
      alertThreshold: 85,
      notes: 'Electricity, broadband internet, and mobile recharge',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_budget_shopping',
      category: 'Shopping',
      limit: 5000,
      period: 'monthly',
      month,
      alertThreshold: 75,
      notes: 'Apparel, electronics, and household items',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}

function readStoredBudgets(): BudgetItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildSeedBudgets(getCurrentMonthString());
      writeStoredBudgets(seeded);
      return seeded;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((entry) => normalizeBudget(entry as RawBudgetResponse));
  } catch {
    return [];
  }
}

function writeStoredBudgets(budgets: BudgetItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  } catch {
    // Ignore storage quota errors in restricted browser contexts
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
  } catch {
    // Fall back to HTTP status text
  }
  return `Request failed with status ${response.status}`;
}

export const budgetService = {
  async getAll(month?: string): Promise<BudgetItem[]> {
    if (API_BASE_URL) {
      const query = month ? `?month=${encodeURIComponent(month)}` : '';
      const response = await fetch(`${API_BASE_URL}/budgets${query}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const list: RawBudgetResponse[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.budgets)
        ? data.budgets
        : Array.isArray(data?.data)
        ? data.data
        : [];

      return list.map(normalizeBudget);
    }

    const allBudgets = readStoredBudgets();
    if (!month) return allBudgets;
    return allBudgets.filter((item) => item.month === month);
  },

  async create(payload: BudgetPayload): Promise<BudgetItem> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/budgets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const created: RawBudgetResponse = data?.budget ?? data?.data ?? data;
      return normalizeBudget(created);
    }

    const allBudgets = readStoredBudgets();
    const duplicate = allBudgets.some(
      (item) =>
        item.month === payload.month &&
        item.category.trim().toLowerCase() ===
          payload.category.trim().toLowerCase()
    );

    if (duplicate) {
      throw new Error(
        `A budget for "${payload.category}" already exists for ${payload.month}.`
      );
    }

    const nowIso = new Date().toISOString();
    const newBudget: BudgetItem = {
      id: generateLocalId(),
      category: payload.category.trim(),
      limit: Number(payload.limit),
      period: payload.period,
      month: payload.month,
      alertThreshold: Number(payload.alertThreshold),
      notes: payload.notes?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    writeStoredBudgets([newBudget, ...allBudgets]);
    return newBudget;
  },

  async update(id: string, payload: BudgetPayload): Promise<BudgetItem> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/budgets/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const updated: RawBudgetResponse = data?.budget ?? data?.data ?? data;
      return normalizeBudget(updated);
    }

    const allBudgets = readStoredBudgets();
    const index = allBudgets.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error('Budget not found.');
    }

    const duplicate = allBudgets.some(
      (item) =>
        item.id !== id &&
        item.month === payload.month &&
        item.category.trim().toLowerCase() ===
          payload.category.trim().toLowerCase()
    );

    if (duplicate) {
      throw new Error(
        `A budget for "${payload.category}" already exists for ${payload.month}.`
      );
    }

    const updatedBudget: BudgetItem = {
      ...allBudgets[index],
      category: payload.category.trim(),
      limit: Number(payload.limit),
      period: payload.period,
      month: payload.month,
      alertThreshold: Number(payload.alertThreshold),
      notes: payload.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...allBudgets];
    nextList[index] = updatedBudget;
    writeStoredBudgets(nextList);

    return updatedBudget;
  },

  async remove(id: string): Promise<void> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/budgets/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }
      return;
    }

    const allBudgets = readStoredBudgets();
    const filtered = allBudgets.filter((item) => item.id !== id);
    writeStoredBudgets(filtered);
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