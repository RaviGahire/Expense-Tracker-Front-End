import { apiRequest } from '../../../services/apiClient';
import { accountService } from '../../accounts/services/accountService';
import { categoryService } from '../../categories/services/categoryService';
import type {
  RecurringFrequency,
  RecurringPayload,
  RecurringRule,
  RecurringRuleStatus,
} from '../types/recurring.types';
import type { TransactionFormValues } from '../../transactions/components/TransactionForm';

interface RawRecurringResponse {
  id?: string;
  _id?: string;
  title?: string;
  amount?: number | string;
  type?: 'expense' | 'income';
  category?: string;
  categoryId?: string | { _id?: string; id?: string; name?: string; label?: string };
  accountId?: string | { _id?: string; id?: string; name?: string };
  paymentMethod?: string;
  frequency?: RecurringFrequency;
  startDate?: string;
  nextDate?: string;
  nextRunDate?: string;
  endDate?: string;
  lastProcessedDate?: string;
  status?: RecurringRuleStatus;
  isActive?: boolean;
  autoCreate?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TriggeredOccurrenceResult {
  updatedRule: RecurringRule;
  transactionPayload: TransactionFormValues;
}

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

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
    const targetMonthIndex = month;
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

function extractRefName(
  ref?: string | { name?: string; label?: string } | null
): string | undefined {
  if (!ref || typeof ref === 'string') return undefined;
  return ref.label ?? ref.name;
}

function normalizeRule(raw: RawRecurringResponse): RecurringRule {
  const today = getTodayDateString();
  const parsedAmount = Number(raw.amount);

  const categoryName =
    extractRefName(raw.categoryId) ??
    (raw.category && !OBJECT_ID_REGEX.test(raw.category) ? raw.category : undefined) ??
    'Bills & Utilities';

  const accountName =
    extractRefName(raw.accountId) ?? raw.paymentMethod ?? 'UPI';

  const rawStart = raw.startDate ? String(raw.startDate).slice(0, 10) : today;
  const rawNext = raw.nextDate ?? raw.nextRunDate ?? raw.startDate;
  const normalizedNext = rawNext ? String(rawNext).slice(0, 10) : rawStart;

  const derivedStatus: RecurringRuleStatus = isValidStatus(raw.status)
    ? raw.status
    : typeof raw.isActive === 'boolean'
    ? raw.isActive
      ? 'active'
      : 'paused'
    : 'active';

  return {
    id: String(raw.id ?? raw._id ?? ''),
    title: String(raw.title ?? 'Untitled Schedule').trim(),
    amount: !Number.isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0,
    type: raw.type === 'income' ? 'income' : 'expense',
    category: String(categoryName).trim(),
    paymentMethod: String(accountName).trim(),
    frequency: isValidFrequency(raw.frequency) ? raw.frequency : 'monthly',
    startDate: rawStart,
    nextDate: normalizedNext,
    endDate: raw.endDate ? String(raw.endDate).slice(0, 10) : undefined,
    lastProcessedDate: raw.lastProcessedDate
      ? String(raw.lastProcessedDate).slice(0, 10)
      : undefined,
    status: derivedStatus,
    autoCreate: typeof raw.autoCreate === 'boolean' ? raw.autoCreate : true,
    notes: raw.notes ? String(raw.notes).trim() : undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

async function resolveBackendRecurringBody(payload: RecurringPayload) {
  const accounts = await accountService.getAll();
  const pm = (payload.paymentMethod ?? '').toLowerCase();
  const matchedAccount =
    accounts.find((a) => a.name.toLowerCase() === pm) ??
    accounts.find((a) => pm.includes('cash') && a.type === 'cash') ??
    accounts.find((a) => pm.includes('credit') && a.type === 'credit_card') ??
    accounts.find((a) => pm.includes('upi') && a.type === 'wallet') ??
    accounts.find((a) => pm.includes('bank') && a.type === 'bank') ??
    accounts.find((a) => a.isDefault) ??
    accounts[0];

  if (!matchedAccount?.id) {
    throw new Error('Please create at least one account before adding a recurring rule.');
  }

  let categoryId = OBJECT_ID_REGEX.test(payload.category)
    ? payload.category
    : undefined;

  if (!categoryId && payload.category) {
    const categories = await categoryService.getAll();
    const targetName = payload.category.trim().toLowerCase();
    const matchedCategory =
      categories.find(
        (c) =>
          c.type === payload.type &&
          (c.label.toLowerCase() === targetName || c.value.toLowerCase() === targetName)
      ) ??
      categories.find(
        (c) =>
          c.label.toLowerCase() === targetName || c.value.toLowerCase() === targetName
      );

    if (matchedCategory?.id && OBJECT_ID_REGEX.test(matchedCategory.id)) {
      categoryId = matchedCategory.id;
    } else {
      const createdCategory = await categoryService.create({
        label: payload.category.trim(),
        type: payload.type,
        color: payload.type === 'income' ? 'income' : 'brand',
        iconName: 'IconRepeat',
      });
      categoryId = createdCategory.id;
    }
  }

  const nextDate = payload.nextDate || payload.startDate;
  const status = payload.status ?? 'active';

  return {
    title: payload.title.trim(),
    amount: Number(payload.amount),
    type: payload.type,
    accountId: matchedAccount.id,
    categoryId,
    category: payload.category.trim(),
    paymentMethod: payload.paymentMethod.trim(),
    frequency: payload.frequency,
    startDate: payload.startDate,
    nextDate,
    nextRunDate: nextDate,
    ...(payload.endDate?.trim() ? { endDate: payload.endDate.trim() } : {}),
    status,
    isActive: status === 'active',
    autoCreate: payload.autoCreate,
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
  };
}

export const recurringService = {
  async getAll(): Promise<RecurringRule[]> {
    const data = await apiRequest<
      { rules?: RawRecurringResponse[]; data?: RawRecurringResponse[] } | RawRecurringResponse[]
    >('/recurring');

    const list: RawRecurringResponse[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.rules)
      ? data.rules
      : Array.isArray(data?.data)
      ? data.data
      : [];

    return list.map(normalizeRule);
  },

  async create(payload: RecurringPayload): Promise<RecurringRule> {
    const body = await resolveBackendRecurringBody(payload);
    const data = await apiRequest<
      { rule?: RawRecurringResponse; data?: RawRecurringResponse } & RawRecurringResponse
    >('/recurring', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const created: RawRecurringResponse = data?.rule ?? data?.data ?? data;
    return normalizeRule({
      ...created,
      category: created.category ?? payload.category,
      paymentMethod: created.paymentMethod ?? payload.paymentMethod,
    });
  },

  async update(id: string, payload: RecurringPayload): Promise<RecurringRule> {
    const body = await resolveBackendRecurringBody(payload);
    const data = await apiRequest<
      { rule?: RawRecurringResponse; data?: RawRecurringResponse } & RawRecurringResponse
    >(`/recurring/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...body,
        endDate: payload.endDate?.trim() || null,
        notes: payload.notes?.trim() || null,
      }),
    });

    const updated: RawRecurringResponse = data?.rule ?? data?.data ?? data;
    return normalizeRule({
      ...updated,
      category: updated.category ?? payload.category,
      paymentMethod: updated.paymentMethod ?? payload.paymentMethod,
    });
  },

  async toggleStatus(id: string): Promise<RecurringRule> {
    const allRules = await this.getAll();
    const target = allRules.find((item) => item.id === id);

    if (!target) {
      throw new Error('Recurring schedule not found.');
    }

    const nextStatus: RecurringRuleStatus =
      target.status === 'active' ? 'paused' : 'active';

    const data = await apiRequest<
      { rule?: RawRecurringResponse; data?: RawRecurringResponse } & RawRecurringResponse
    >(`/recurring/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: nextStatus,
        isActive: nextStatus === 'active',
      }),
    });

    const updated: RawRecurringResponse = data?.rule ?? data?.data ?? data;
    return normalizeRule(updated);
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/recurring/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
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
  },
};