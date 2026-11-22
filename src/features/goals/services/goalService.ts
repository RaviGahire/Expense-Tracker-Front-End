import { apiRequest } from '../../../services/apiClient';
import type { CategoryColorToken } from '../../categories/components/CategoryIcon';
import type {
  ContributionPayload,
  GoalContributionEntry,
  GoalPayload,
  GoalPriority,
  GoalStatus,
  SavingsGoal,
} from '../types/goal.types';

interface RawContributionEntry {
  id?: string;
  _id?: string;
  amount?: number | string;
  date?: string;
  note?: string;
  notes?: string;
}

interface RawGoalResponse {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  category?: string;
  targetAmount?: number | string;
  currentAmount?: number | string;
  targetDate?: string;
  deadline?: string;
  priority?: GoalPriority;
  status?: GoalStatus;
  color?: CategoryColorToken;
  iconName?: string;
  notes?: string;
  contributions?: RawContributionEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export function getTodayGoalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidPriority(value: unknown): value is GoalPriority {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isValidStatus(value: unknown): value is GoalStatus {
  return value === 'active' || value === 'completed' || value === 'paused';
}

function isValidColor(value: unknown): value is CategoryColorToken {
  return (
    value === 'brand' ||
    value === 'income' ||
    value === 'expense' ||
    value === 'warning' ||
    value === 'neutral'
  );
}

function resolveStatus(
  currentAmount: number,
  targetAmount: number,
  explicitStatus?: GoalStatus
): GoalStatus {
  if (targetAmount > 0 && currentAmount >= targetAmount) {
    return 'completed';
  }
  if (explicitStatus === 'paused') {
    return 'paused';
  }
  return 'active';
}

function normalizeGoal(raw: RawGoalResponse): SavingsGoal {
  const parsedTarget = Number(raw.targetAmount);
  const parsedCurrent = Number(raw.currentAmount);

  const targetAmount =
    !Number.isNaN(parsedTarget) && parsedTarget > 0 ? parsedTarget : 1000;
  const currentAmount =
    !Number.isNaN(parsedCurrent) && parsedCurrent >= 0 ? parsedCurrent : 0;

  const contributions: GoalContributionEntry[] = Array.isArray(raw.contributions)
    ? raw.contributions
        .filter((entry) => entry && entry.amount !== undefined)
        .map((entry, idx) => ({
          id: String(entry.id ?? entry._id ?? `contrib_${idx}`),
          amount: Number(entry.amount) || 0,
          date: entry.date
            ? String(entry.date).slice(0, 10)
            : getTodayGoalDate(),
          note: (entry.note ?? entry.notes)
            ? String(entry.note ?? entry.notes).trim()
            : undefined,
        }))
    : [];

  const rawDate = raw.targetDate ?? raw.deadline;

  return {
    id: String(raw.id ?? raw._id ?? ''),
    title: String(raw.title ?? raw.name ?? 'Untitled Goal').trim(),
    category: String(raw.category ?? 'Savings & Investments').trim(),
    targetAmount,
    currentAmount,
    targetDate: rawDate ? String(rawDate).slice(0, 10) : undefined,
    priority: isValidPriority(raw.priority) ? raw.priority : 'medium',
    status: resolveStatus(
      currentAmount,
      targetAmount,
      isValidStatus(raw.status) ? raw.status : undefined
    ),
    color: isValidColor(raw.color) ? raw.color : 'brand',
    iconName: raw.iconName ? String(raw.iconName).trim() : undefined,
    notes: raw.notes ? String(raw.notes).trim() : undefined,
    contributions,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function buildBackendGoalBody(payload: GoalPayload) {
  const targetAmount = Number(payload.targetAmount);
  const currentAmount = Number(payload.currentAmount);
  const trimmedDate = payload.targetDate?.trim();

  return {
    title: payload.title.trim(),
    name: payload.title.trim(),
    category: payload.category.trim(),
    targetAmount,
    currentAmount,
    ...(trimmedDate ? { targetDate: trimmedDate, deadline: trimmedDate } : {}),
    priority: payload.priority,
    status: resolveStatus(currentAmount, targetAmount, payload.status),
    color: payload.color,
    ...(payload.iconName?.trim() ? { iconName: payload.iconName.trim() } : {}),
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
  };
}

export const goalService = {
  async getAll(): Promise<SavingsGoal[]> {
    const data = await apiRequest<
      { goals?: RawGoalResponse[]; data?: RawGoalResponse[] } | RawGoalResponse[]
    >('/goals');

    const list: RawGoalResponse[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.goals)
      ? data.goals
      : Array.isArray(data?.data)
      ? data.data
      : [];

    return list.map(normalizeGoal);
  },

  async create(payload: GoalPayload): Promise<SavingsGoal> {
    const data = await apiRequest<
      { goal?: RawGoalResponse; data?: RawGoalResponse } & RawGoalResponse
    >('/goals', {
      method: 'POST',
      body: JSON.stringify(buildBackendGoalBody(payload)),
    });

    const created: RawGoalResponse = data?.goal ?? data?.data ?? data;
    return normalizeGoal(created);
  },

  async update(id: string, payload: GoalPayload): Promise<SavingsGoal> {
    const trimmedDate = payload.targetDate?.trim();
    const data = await apiRequest<
      { goal?: RawGoalResponse; data?: RawGoalResponse } & RawGoalResponse
    >(`/goals/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...buildBackendGoalBody(payload),
        targetDate: trimmedDate || null,
        deadline: trimmedDate || null,
        notes: payload.notes?.trim() || null,
      }),
    });

    const updated: RawGoalResponse = data?.goal ?? data?.data ?? data;
    return normalizeGoal(updated);
  },

  async addContribution(
    id: string,
    contribution: ContributionPayload
  ): Promise<SavingsGoal> {
    const data = await apiRequest<
      { goal?: RawGoalResponse; data?: RawGoalResponse } & RawGoalResponse
    >(`/goals/${encodeURIComponent(id)}/contributions`, {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(contribution.amount),
        date: contribution.date || getTodayGoalDate(),
        ...(contribution.note?.trim()
          ? { note: contribution.note.trim(), notes: contribution.note.trim() }
          : {}),
      }),
    });

    const updated: RawGoalResponse = data?.goal ?? data?.data ?? data;
    return normalizeGoal(updated);
  },

  async togglePause(id: string): Promise<SavingsGoal> {
    const allGoals = await this.getAll();
    const target = allGoals.find((item) => item.id === id);

    if (!target) {
      throw new Error('Savings goal not found.');
    }

    if (target.status === 'completed') {
      return target;
    }

    const nextStatus: GoalStatus =
      target.status === 'active' ? 'paused' : 'active';

    const data = await apiRequest<
      { goal?: RawGoalResponse; data?: RawGoalResponse } & RawGoalResponse
    >(`/goals/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });

    const updated: RawGoalResponse = data?.goal ?? data?.data ?? data;
    return normalizeGoal(updated);
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/goals/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};