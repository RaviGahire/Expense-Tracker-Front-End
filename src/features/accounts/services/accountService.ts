import type { CategoryColorToken } from '../../categories/components/CategoryIcon';
import type {
  Account,
  AccountPayload,
  AccountType,
  TransferPayload,
} from '../types/account.types';

const STORAGE_KEY = 'fintrack_accounts_v1';
const TOKEN_STORAGE_KEY = 'fintrack_auth_token';
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

interface RawAccountResponse {
  id?: string;
  _id?: string;
  name?: string;
  type?: AccountType;
  balance?: number | string;
  creditLimit?: number | string;
  institution?: string;
  accountNumberLast4?: string;
  color?: CategoryColorToken;
  iconName?: string;
  isDefault?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function getTodayAccountDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateAccountId(prefix: string = 'acc'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isValidAccountType(value: unknown): value is AccountType {
  return (
    value === 'cash' ||
    value === 'bank' ||
    value === 'credit_card' ||
    value === 'wallet' ||
    value === 'savings'
  );
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

export function getDefaultIconForAccountType(type: AccountType): string {
  switch (type) {
    case 'cash':
      return 'IconCash';
    case 'bank':
      return 'IconBuildingBank';
    case 'credit_card':
      return 'IconCreditCard';
    case 'wallet':
      return 'IconWallet';
    case 'savings':
      return 'IconPigMoney';
  }
}

function normalizeAccount(raw: RawAccountResponse): Account {
  const type: AccountType = isValidAccountType(raw.type) ? raw.type : 'bank';
  const parsedBalance = Number(raw.balance);
  const balance = !Number.isNaN(parsedBalance) ? parsedBalance : 0;

  const parsedLimit =
    raw.creditLimit !== undefined && raw.creditLimit !== ''
      ? Number(raw.creditLimit)
      : undefined;
  const creditLimit =
    parsedLimit !== undefined && !Number.isNaN(parsedLimit) && parsedLimit >= 0
      ? parsedLimit
      : undefined;

  return {
    id: String(raw.id ?? raw._id ?? generateAccountId('acc')),
    name: String(raw.name ?? 'Untitled Account').trim(),
    type,
    balance,
    creditLimit,
    institution: raw.institution ? String(raw.institution).trim() : undefined,
    accountNumberLast4: raw.accountNumberLast4
      ? String(raw.accountNumberLast4).trim()
      : undefined,
    color: isValidColor(raw.color) ? raw.color : 'brand',
    iconName: raw.iconName
      ? String(raw.iconName).trim()
      : getDefaultIconForAccountType(type),
    isDefault: Boolean(raw.isDefault),
    notes: raw.notes ? String(raw.notes).trim() : undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function buildSeedAccounts(): Account[] {
  const nowIso = new Date().toISOString();

  return [
    {
      id: 'seed_acc_primary_bank',
      name: 'Primary Checking Account',
      type: 'bank',
      balance: 68500,
      institution: 'HDFC Bank',
      accountNumberLast4: '4821',
      color: 'brand',
      iconName: 'IconBuildingBank',
      isDefault: true,
      notes: 'Main salary and bill payment account',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_acc_savings',
      name: 'High-Yield Savings',
      type: 'savings',
      balance: 145000,
      institution: 'ICICI Bank',
      accountNumberLast4: '9104',
      color: 'income',
      iconName: 'IconPigMoney',
      isDefault: false,
      notes: 'Dedicated emergency & goal reserve account',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_acc_upi_wallet',
      name: 'UPI & Digital Wallet',
      type: 'wallet',
      balance: 4250,
      institution: 'PhonePe / GPay',
      color: 'warning',
      iconName: 'IconWallet',
      isDefault: false,
      notes: 'Everyday micro-payments, transit, and coffee',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'seed_acc_cash',
      name: 'Physical Cash',
      type: 'cash',
      balance: 3200,
      color: 'neutral',
      iconName: 'IconCash',
      isDefault: false,
      notes: 'Cash on hand',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}

function readStoredAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildSeedAccounts();
      writeStoredAccounts(seeded);
      return seeded;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => normalizeAccount(item as RawAccountResponse));
  } catch {
    return [];
  }
}

function writeStoredAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
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

export const accountService = {
  async getAll(): Promise<Account[]> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const list: RawAccountResponse[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.accounts)
        ? data.accounts
        : Array.isArray(data?.data)
        ? data.data
        : [];

      return list.map(normalizeAccount);
    }

    return readStoredAccounts();
  },

  async create(payload: AccountPayload): Promise<Account> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const created: RawAccountResponse = data?.account ?? data?.data ?? data;
      return normalizeAccount(created);
    }

    const allAccounts = readStoredAccounts();
    const nowIso = new Date().toISOString();
    const shouldBeDefault = Boolean(payload.isDefault) || allAccounts.length === 0;

    const newAccount: Account = {
      id: generateAccountId('acc'),
      name: payload.name.trim(),
      type: payload.type,
      balance: Number(payload.balance) || 0,
      creditLimit:
        payload.type === 'credit_card' && payload.creditLimit !== undefined
          ? Number(payload.creditLimit)
          : undefined,
      institution: payload.institution?.trim() || undefined,
      accountNumberLast4: payload.accountNumberLast4?.trim() || undefined,
      color: payload.color,
      iconName:
        payload.iconName?.trim() || getDefaultIconForAccountType(payload.type),
      isDefault: shouldBeDefault,
      notes: payload.notes?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const nextList = shouldBeDefault
      ? [
          newAccount,
          ...allAccounts.map((acc) => ({ ...acc, isDefault: false })),
        ]
      : [newAccount, ...allAccounts];

    writeStoredAccounts(nextList);
    return newAccount;
  },

  async update(id: string, payload: AccountPayload): Promise<Account> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/accounts/${encodeURIComponent(id)}`,
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
      const updated: RawAccountResponse = data?.account ?? data?.data ?? data;
      return normalizeAccount(updated);
    }

    const allAccounts = readStoredAccounts();
    const index = allAccounts.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error('Account not found.');
    }

    const existing = allAccounts[index];
    const makeDefault = Boolean(payload.isDefault);

    const updatedAccount: Account = {
      ...existing,
      name: payload.name.trim(),
      type: payload.type,
      balance: Number(payload.balance) || 0,
      creditLimit:
        payload.type === 'credit_card' && payload.creditLimit !== undefined
          ? Number(payload.creditLimit)
          : undefined,
      institution: payload.institution?.trim() || undefined,
      accountNumberLast4: payload.accountNumberLast4?.trim() || undefined,
      color: payload.color,
      iconName:
        payload.iconName?.trim() || getDefaultIconForAccountType(payload.type),
      isDefault: makeDefault ? true : existing.isDefault,
      notes: payload.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    const nextList = allAccounts.map((item, idx) => {
      if (idx === index) return updatedAccount;
      if (makeDefault) return { ...item, isDefault: false };
      return item;
    });

    writeStoredAccounts(nextList);
    return updatedAccount;
  },

  async setDefault(id: string): Promise<Account[]> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/accounts/${encodeURIComponent(id)}/default`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      return this.getAll();
    }

    const allAccounts = readStoredAccounts();
    const exists = allAccounts.some((item) => item.id === id);
    if (!exists) {
      throw new Error('Account not found.');
    }

    const nextList = allAccounts.map((item) => ({
      ...item,
      isDefault: item.id === id,
      updatedAt: item.id === id ? new Date().toISOString() : item.updatedAt,
    }));

    writeStoredAccounts(nextList);
    return nextList;
  },

  /**
   * Adjusts an account's balance by `delta` (+amount for income, -amount for expense).
   * Used automatically when transactions are created, edited, or deleted.
   */
  async adjustBalance(accountId: string, delta: number): Promise<Account | null> {
    if (!accountId || delta === 0 || Number.isNaN(delta)) {
      return null;
    }

    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/accounts/${encodeURIComponent(accountId)}/adjust`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ delta }),
        }
      );

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data = await response.json();
      const updated: RawAccountResponse = data?.account ?? data?.data ?? data;
      return normalizeAccount(updated);
    }

    const allAccounts = readStoredAccounts();
    const index = allAccounts.findIndex((item) => item.id === accountId);
    if (index === -1) {
      return null;
    }

    const updatedAccount: Account = {
      ...allAccounts[index],
      balance: Number((allAccounts[index].balance + delta).toFixed(2)),
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...allAccounts];
    nextList[index] = updatedAccount;
    writeStoredAccounts(nextList);

    return updatedAccount;
  },

  /**
   * Moves `amount` from `fromAccountId` to `toAccountId`.
   */
  async transfer(payload: TransferPayload): Promise<Account[]> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/accounts/transfer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      return this.getAll();
    }

    const allAccounts = readStoredAccounts();
    const fromIndex = allAccounts.findIndex(
      (item) => item.id === payload.fromAccountId
    );
    const toIndex = allAccounts.findIndex(
      (item) => item.id === payload.toAccountId
    );

    if (fromIndex === -1 || toIndex === -1) {
      throw new Error('One or both selected accounts could not be found.');
    }

    const amount = Number(payload.amount);
    const nowIso = new Date().toISOString();

    const nextList = [...allAccounts];
    nextList[fromIndex] = {
      ...nextList[fromIndex],
      balance: Number((nextList[fromIndex].balance - amount).toFixed(2)),
      updatedAt: nowIso,
    };
    nextList[toIndex] = {
      ...nextList[toIndex],
      balance: Number((nextList[toIndex].balance + amount).toFixed(2)),
      updatedAt: nowIso,
    };

    writeStoredAccounts(nextList);
    return nextList;
  },

  async remove(id: string): Promise<void> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/accounts/${encodeURIComponent(id)}`,
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

    const allAccounts = readStoredAccounts();
    const remaining = allAccounts.filter((item) => item.id !== id);

    // Ensure at least one account remains marked as default if any accounts exist
    if (remaining.length > 0 && !remaining.some((acc) => acc.isDefault)) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }

    writeStoredAccounts(remaining);
  },
};