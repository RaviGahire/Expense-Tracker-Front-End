import type { CategoryColorToken } from '../../categories/components/CategoryIcon';
import type {
  ContributionPayload,
  GoalContributionEntry,
  GoalPayload,
  GoalPriority,
  GoalStatus,
  SavingsGoal,
} from '../types/goal.types';

const STORAGE_KEY = 'fintrack_goals_v1';
const TOKEN_STORAGE_KEY = 'fintrack_auth_token';
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

interface RawGoalResponse {
  id?: string;
  _id?: string;
  title?: string;
  category?: string;
  targetAmount?: number | string;
  currentAmount?: number | string;
  targetDate?: string;
  priority?: GoalPriority;
  status?: GoalStatus;
  color?: CategoryColorToken;
  iconName?: string;
  notes?: string;
  contributions?: GoalContributionEntry[];
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




function formatOffsetGoalDate(monthsAhead: number): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 15);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateGoalId(prefix: string = 'goal'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
        .filter((entry) => entry && typeof entry.amount === 'number')
        .map((entry) => ({
          id: String(entry.id ?? generateGoalId('contrib')),
          amount: Number(entry.amount),
          date: String(entry.date ?? getTodayGoalDate()),
          note: entry.note ? String(entry.note).trim() : undefined,
        }))
    : [];

  return {
    id: String(raw.id ?? raw._id ?? generateGoalId('goal')),
    title: String(raw.title ?? 'Untitled Goal').trim(),
    category: String(raw.category ?? 'Savings & Investments').trim(),
    targetAmount,
    currentAmount,
    targetDate: raw.targetDate ? String(raw.targetDate).trim() : undefined,
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

function buildSeedGoals(): SavingsGoal[] {
  const nowIso = new Date().toISOString();
  const today = getTodayGoalDate();

  return [
    {
      id: 'seed_goal_emergency',
      title: '6-Month Emergency Fund',
      category: 'Savings & Investments',
      targetAmount: 180000,
      currentAmount: 115000,
      targetDate: formatOffsetGoalDate(6),
      priority: 'high',
      status: 'active',
      color: 'income',
      iconName: 'IconShieldCheck',
      notes: 'Liquid reserve covering 6 months of core living expenses',
      contributions: [
        {
          id: 'seed_contrib_1',
          amount: 115000,
          date: today,
          note: 'Initial emergency reserve deposit',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_goal_workstation',
      title: 'Developer Workstation Upgrade',
      category: 'Shopping',
      targetAmount: 85000,
      currentAmount: 42500,
      targetDate: formatOffsetGoalDate(3),
      priority: 'medium',
      status: 'active',
      color: 'brand',
      iconName: 'IconDeviceLaptop',
      notes: '4K external display and ergonomic desk setup',
      contributions: [
        {
          id: 'seed_contrib_2',
          amount: 42500,
          date: today,
          note: 'Saved from freelance milestone',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_goal_trip',
      title: 'Himalayan Trek & Travel Fund',
      category: 'Travel',
      targetAmount: 35000,
      currentAmount: 35000,
      targetDate: today,
      priority: 'low',
      status: 'completed',
      color: 'brand',
      iconName: 'IconPlane',
      notes: 'Flights, gear, and stay fully funded',
      contributions: [
        {
          id: 'seed_contrib_3',
          amount: 35000,
          date: today,
          note: 'Final travel installment',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}

function readStoredGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildSeedGoals();
      writeStoredGoals(seeded);
      return seeded;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => normalizeGoal(item as RawGoalResponse));
  } catch {
    return [];
  }
}

function writeStoredGoals(goals: SavingsGoal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
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

export const goalService = {
  async getAll(): Promise<SavingsGoal[]> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const list: RawGoalResponse[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.goals)
        ? data.goals
        : Array.isArray(data?.data)
        ? data.data
        : [];

      return list.map(normalizeGoal);
    }

    return readStoredGoals();
  },

  async create(payload: GoalPayload): Promise<SavingsGoal> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const created: RawGoalResponse = data?.goal ?? data?.data ?? data;
      return normalizeGoal(created);
    }

    const allGoals = readStoredGoals();
    const nowIso = new Date().toISOString();
    const targetAmount = Number(payload.targetAmount);
    const currentAmount = Number(payload.currentAmount);

    const initialContributions: GoalContributionEntry[] =
      currentAmount > 0
        ? [
            {
              id: generateGoalId('contrib'),
              amount: currentAmount,
              date: getTodayGoalDate(),
              note: 'Starting balance',
            },
          ]
        : [];

    const newGoal: SavingsGoal = {
      id: generateGoalId('goal'),
      title: payload.title.trim(),
      category: payload.category.trim(),
      targetAmount,
      currentAmount,
      targetDate: payload.targetDate?.trim() || undefined,
      priority: payload.priority,
      status: resolveStatus(currentAmount, targetAmount, payload.status),
      color: payload.color,
      iconName: payload.iconName?.trim() || undefined,
      notes: payload.notes?.trim() || undefined,
      contributions: initialContributions,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    writeStoredGoals([newGoal, ...allGoals]);
    return newGoal;
  },

  async update(id: string, payload: GoalPayload): Promise<SavingsGoal> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/goals/${encodeURIComponent(id)}`,
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
      const updated: RawGoalResponse = data?.goal ?? data?.data ?? data;
      return normalizeGoal(updated);
    }

    const allGoals = readStoredGoals();
    const index = allGoals.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error('Savings goal not found.');
    }

    const existing = allGoals[index];
    const targetAmount = Number(payload.targetAmount);
    const currentAmount = Number(payload.currentAmount);

    const updatedGoal: SavingsGoal = {
      ...existing,
      title: payload.title.trim(),
      category: payload.category.trim(),
      targetAmount,
      currentAmount,
      targetDate: payload.targetDate?.trim() || undefined,
      priority: payload.priority,
      status: resolveStatus(
        currentAmount,
        targetAmount,
        payload.status ?? existing.status
      ),
      color: payload.color,
      iconName: payload.iconName?.trim() || undefined,
      notes: payload.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...allGoals];
    nextList[index] = updatedGoal;
    writeStoredGoals(nextList);

    return updatedGoal;
  },

  async addContribution(
    id: string,
    contribution: ContributionPayload
  ): Promise<SavingsGoal> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/goals/${encodeURIComponent(id)}/contributions`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(contribution),
        }
      );

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const updated: RawGoalResponse = data?.goal ?? data?.data ?? data;
      return normalizeGoal(updated);
    }

    const allGoals = readStoredGoals();
    const index = allGoals.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error('Savings goal not found.');
    }

    const existing = allGoals[index];
    const addedAmount = Number(contribution.amount);
    const nextCurrent = existing.currentAmount + addedAmount;

    const newEntry: GoalContributionEntry = {
      id: generateGoalId('contrib'),
      amount: addedAmount,
      date: contribution.date || getTodayGoalDate(),
      note: contribution.note?.trim() || undefined,
    };

    const updatedGoal: SavingsGoal = {
      ...existing,
      currentAmount: nextCurrent,
      status: resolveStatus(
        nextCurrent,
        existing.targetAmount,
        existing.status === 'paused' ? 'active' : existing.status
      ),
      contributions: [newEntry, ...existing.contributions],
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...allGoals];
    nextList[index] = updatedGoal;
    writeStoredGoals(nextList);

    return updatedGoal;
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

    return this.update(id, {
      title: target.title,
      category: target.category,
      targetAmount: target.targetAmount,
      currentAmount: target.currentAmount,
      targetDate: target.targetDate,
      priority: target.priority,
      status: nextStatus,
      color: target.color,
      iconName: target.iconName,
      notes: target.notes,
    });
  },

  async remove(id: string): Promise<void> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/goals/${encodeURIComponent(id)}`,
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

    const allGoals = readStoredGoals();
    const filtered = allGoals.filter((item) => item.id !== id);
    writeStoredGoals(filtered);
  },
};