import type {
  RecurringFrequency,
  RecurringPayload,
  RecurringRule,
  RecurringRuleStatus,
} from '../types/recurring.types';
import type { TransactionFormValues } from '../../transactions/components/TransactionForm';

const STORAGE_KEY = 'fintrack_recurring_v1';
const TOKEN_STORAGE_KEY = 'fintrack_auth_token';
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

interface RawRecurringResponse {
  id?: string;
  _id?: string;
  title?: string;
  amount?: number | string;
  type?: 'expense' | 'income';
  category?: string;
  paymentMethod?: string;
  frequency?: RecurringFrequency;
  startDate?: string;
  nextDate?: string;
  endDate?: string;
  lastProcessedDate?: string;
  status?: RecurringRuleStatus;
  autoCreate?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TriggeredOccurrenceResult {
  updatedRule: RecurringRule;
  transactionPayload: TransactionFormValues;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function advanceRecurringDate(
  dateString: string,
  frequency: RecurringFrequency
): string {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return getTodayDateString();
  }

  if (frequency === 'daily') {
    const next = new Date(year, month - 1, day + 1);
    return formatLocalDate(next);
  }

  if (frequency === 'weekly') {
    const next = new Date(year, month - 1, day + 7);
    return formatLocalDate(next);
  }

  if (frequency === 'biweekly') {
    const next = new Date(year, month - 1, day + 14);
    return formatLocalDate(next);
  }

  if (frequency === 'monthly') {
    const targetMonthIndex = month; // 0-based next month
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const normalizedMonth = targetMonthIndex % 12;
    const maxDaysInTargetMonth = new Date(
      targetYear,
      normalizedMonth + 1,
      0
    ).getDate();
    const clampedDay = Math.min(day, maxDaysInTargetMonth);
    return formatLocalDate(new Date(targetYear, normalizedMonth, clampedDay));
  }

  // yearly
  const targetYear = year + 1;
  const maxDaysInTargetMonth = new Date(targetYear, month, 0).getDate();
  const clampedDay = Math.min(day, maxDaysInTargetMonth);
  return formatLocalDate(new Date(targetYear, month - 1, clampedDay));
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `rec_${crypto.randomUUID()}`;
  }
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isValidFrequency(value: unknown): value is RecurringFrequency {
  return (
    value === 'daily' ||
    value === 'weekly' ||
    value === 'biweekly' ||
    value === 'monthly' ||
    value === 'yearly'
  );
}

function isValidStatus(value: unknown): value is RecurringRuleStatus {
  return value === 'active' || value === 'paused' || value === 'completed';
}

function normalizeRule(raw: RawRecurringResponse): RecurringRule {
  const today = getTodayDateString();
  const parsedAmount = Number(raw.amount);

  return {
    id: String(raw.id ?? raw._id ?? generateLocalId()),
    title: String(raw.title ?? 'Untitled Schedule').trim(),
    amount: !Number.isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0,
    type: raw.type === 'income' ? 'income' : 'expense',
    category: String(raw.category ?? 'Bills & Utilities').trim(),
    paymentMethod: String(raw.paymentMethod ?? 'UPI').trim(),
    frequency: isValidFrequency(raw.frequency) ? raw.frequency : 'monthly',
    startDate: String(raw.startDate ?? today),
    nextDate: String(raw.nextDate ?? raw.startDate ?? today),
    endDate: raw.endDate ? String(raw.endDate).trim() : undefined,
    lastProcessedDate: raw.lastProcessedDate
      ? String(raw.lastProcessedDate).trim()
      : undefined,
    status: isValidStatus(raw.status) ? raw.status : 'active',
    autoCreate: typeof raw.autoCreate === 'boolean' ? raw.autoCreate : true,
    notes: raw.notes ? String(raw.notes).trim() : undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function buildSeedRules(): RecurringRule[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const nowIso = now.toISOString();

  const currentMonthStart = formatLocalDate(new Date(year, month, 1));
  const nextMonthFirst = formatLocalDate(new Date(year, month + 1, 1));
  const upcomingFiveDays = formatLocalDate(
    new Date(year, month, now.getDate() + 4)
  );
  const upcomingTenDays = formatLocalDate(
    new Date(year, month, now.getDate() + 10)
  );

  return [
    {
      id: 'seed_rec_salary',
      title: 'Monthly Salary',
      amount: 75000,
      type: 'income',
      category: 'Salary',
      paymentMethod: 'Bank Transfer',
      frequency: 'monthly',
      startDate: currentMonthStart,
      nextDate: nextMonthFirst,
      lastProcessedDate: currentMonthStart,
      status: 'active',
      autoCreate: true,
      notes: 'Primary monthly salary credit',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_rec_rent',
      title: 'Apartment Rent',
      amount: 16500,
      type: 'expense',
      category: 'Housing & Rent',
      paymentMethod: 'Bank Transfer',
      frequency: 'monthly',
      startDate: currentMonthStart,
      nextDate: upcomingFiveDays,
      status: 'active',
      autoCreate: true,
      notes: 'Includes monthly society maintenance',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_rec_broadband',
      title: 'Fiber Broadband Plan',
      amount: 999,
      type: 'expense',
      category: 'Bills & Utilities',
      paymentMethod: 'UPI',
      frequency: 'monthly',
      startDate: currentMonthStart,
      nextDate: upcomingTenDays,
      status: 'active',
      autoCreate: true,
      notes: '300 Mbps unlimited monthly billing',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_rec_cloud',
      title: 'Cloud Storage & Dev Tools',
      amount: 650,
      type: 'expense',
      category: 'Subscriptions',
      paymentMethod: 'Credit Card',
      frequency: 'monthly',
      startDate: currentMonthStart,
      nextDate: nextMonthFirst,
      status: 'paused',
      autoCreate: false,
      notes: 'Paused until next project sprint',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}

function readStoredRules(): RecurringRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildSeedRules();
      writeStoredRules(seeded);
      return seeded;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((entry) => normalizeRule(entry as RawRecurringResponse));
  } catch {
    return [];
  }
}

function writeStoredRules(rules: RecurringRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
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

export const recurringService = {
  async getAll(): Promise<RecurringRule[]> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/recurring`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const list: RawRecurringResponse[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.rules)
        ? data.rules
        : Array.isArray(data?.data)
        ? data.data
        : [];

      return list.map(normalizeRule);
    }

    return readStoredRules();
  },

  async create(payload: RecurringPayload): Promise<RecurringRule> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/recurring`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const created: RawRecurringResponse = data?.rule ?? data?.data ?? data;
      return normalizeRule(created);
    }

    const allRules = readStoredRules();
    const nowIso = new Date().toISOString();

    const newRule: RecurringRule = {
      id: generateLocalId(),
      title: payload.title.trim(),
      amount: Number(payload.amount),
      type: payload.type,
      category: payload.category.trim(),
      paymentMethod: payload.paymentMethod.trim(),
      frequency: payload.frequency,
      startDate: payload.startDate,
      nextDate: payload.nextDate,
      endDate: payload.endDate?.trim() || undefined,
      status: payload.status ?? 'active',
      autoCreate: payload.autoCreate,
      notes: payload.notes?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    writeStoredRules([newRule, ...allRules]);
    return newRule;
  },

  async update(id: string, payload: RecurringPayload): Promise<RecurringRule> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/recurring/${encodeURIComponent(id)}`,
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
      const updated: RawRecurringResponse = data?.rule ?? data?.data ?? data;
      return normalizeRule(updated);
    }

    const allRules = readStoredRules();
    const index = allRules.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error('Recurring schedule not found.');
    }

    const updatedRule: RecurringRule = {
      ...allRules[index],
      title: payload.title.trim(),
      amount: Number(payload.amount),
      type: payload.type,
      category: payload.category.trim(),
      paymentMethod: payload.paymentMethod.trim(),
      frequency: payload.frequency,
      startDate: payload.startDate,
      nextDate: payload.nextDate,
      endDate: payload.endDate?.trim() || undefined,
      status: payload.status ?? allRules[index].status,
      autoCreate: payload.autoCreate,
      notes: payload.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...allRules];
    nextList[index] = updatedRule;
    writeStoredRules(nextList);

    return updatedRule;
  },

  async toggleStatus(id: string): Promise<RecurringRule> {
    const allRules = await this.getAll();
    const target = allRules.find((item) => item.id === id);

    if (!target) {
      throw new Error('Recurring schedule not found.');
    }

    const nextStatus: RecurringRuleStatus =
      target.status === 'active' ? 'paused' : 'active';

    return this.update(id, {
      title: target.title,
      amount: target.amount,
      type: target.type,
      category: target.category,
      paymentMethod: target.paymentMethod,
      frequency: target.frequency,
      startDate: target.startDate,
      nextDate: target.nextDate,
      endDate: target.endDate,
      status: nextStatus,
      autoCreate: target.autoCreate,
      notes: target.notes,
    });
  },

  async remove(id: string): Promise<void> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/recurring/${encodeURIComponent(id)}`,
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

    const allRules = readStoredRules();
    const filtered = allRules.filter((item) => item.id !== id);
    writeStoredRules(filtered);
  },

  async triggerOccurrence(
    rule: RecurringRule,
    occurrenceDate?: string
  ): Promise<TriggeredOccurrenceResult> {
    const executedDate = occurrenceDate ?? rule.nextDate ?? getTodayDateString();
    const computedNextDate = advanceRecurringDate(executedDate, rule.frequency);
    const hasReachedEnd = Boolean(
      rule.endDate && computedNextDate > rule.endDate
    );

    const nextStatus: RecurringRuleStatus = hasReachedEnd
      ? 'completed'
      : rule.status;

    const transactionPayload: TransactionFormValues = {
      title: rule.title,
      amount: rule.amount,
      type: rule.type,
      category: rule.category,
      paymentMethod: rule.paymentMethod,
      date: executedDate,
      notes: rule.notes,
      recurring: {
        isRecurring: false,
        frequency: rule.frequency,
        nextDate: computedNextDate,
        endDate: rule.endDate,
      },
    };

    if (API_BASE_URL) {
      const updatedRule = await this.update(rule.id, {
        title: rule.title,
        amount: rule.amount,
        type: rule.type,
        category: rule.category,
        paymentMethod: rule.paymentMethod,
        frequency: rule.frequency,
        startDate: rule.startDate,
        nextDate: computedNextDate,
        endDate: rule.endDate,
        status: nextStatus,
        autoCreate: rule.autoCreate,
        notes: rule.notes,
      });

      return {
        updatedRule: {
          ...updatedRule,
          lastProcessedDate: executedDate,
        },
        transactionPayload,
      };
    }

    const allRules = readStoredRules();
    const index = allRules.findIndex((item) => item.id === rule.id);
    const updatedRule: RecurringRule = {
      ...rule,
      nextDate: computedNextDate,
      lastProcessedDate: executedDate,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    if (index !== -1) {
      const nextList = [...allRules];
      nextList[index] = updatedRule;
      writeStoredRules(nextList);
    }

    return {
      updatedRule,
      transactionPayload,
    };
  },
};