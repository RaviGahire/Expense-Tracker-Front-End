import type { CategoryColorToken } from '../../categories/components/CategoryIcon';
import { apiRequest } from '../../../services/apiClient';
import type {
  Account,
  AccountPayload,
  AccountType,
  TransferPayload,
} from '../types/account.types';

type BackendAccountType =
  | 'cash'
  | 'bank'
  | 'credit'
  | 'savings'
  | 'investment'
  | 'wallet';

interface RawAccountResponse {
  id?: string;
  _id?: string;
  name?: string;
  type?: AccountType | BackendAccountType;
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

function isValidAccountType(value: unknown): value is AccountType {
  return (
    value === 'cash' ||
    value === 'bank' ||
    value === 'credit_card' ||
    value === 'wallet' ||
    value === 'savings'
  );
}

function toFrontendAccountType(value: unknown): AccountType {
  if (value === 'credit') return 'credit_card';
  return isValidAccountType(value) ? value : 'bank';
}

function toBackendAccountType(type: AccountType): BackendAccountType {
  return type === 'credit_card' ? 'credit' : type;
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
  const type: AccountType = toFrontendAccountType(raw.type);
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
    id: String(raw.id ?? raw._id ?? ''),
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

function buildBackendAccountBody(payload: AccountPayload) {
  return {
    name: payload.name.trim(),
    type: toBackendAccountType(payload.type),
    balance: Number(payload.balance) || 0,
    ...(payload.type === 'credit_card' && payload.creditLimit !== undefined
      ? { creditLimit: Number(payload.creditLimit) }
      : {}),
    ...(payload.institution?.trim()
      ? { institution: payload.institution.trim() }
      : {}),
    ...(payload.accountNumberLast4?.trim()
      ? { accountNumberLast4: payload.accountNumberLast4.trim() }
      : {}),
    color: payload.color,
    iconName:
      payload.iconName?.trim() || getDefaultIconForAccountType(payload.type),
    isDefault: Boolean(payload.isDefault),
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
  };
}

export const accountService = {
  async getAll(): Promise<Account[]> {
    const data = await apiRequest<{
      accounts?: RawAccountResponse[];
      data?: RawAccountResponse[];
    } | RawAccountResponse[]>('/accounts');

    const list: RawAccountResponse[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.accounts)
      ? data.accounts
      : Array.isArray(data?.data)
      ? data.data
      : [];

    return list.map(normalizeAccount);
  },

  async create(payload: AccountPayload): Promise<Account> {
    const data = await apiRequest<{
      account?: RawAccountResponse;
      data?: RawAccountResponse;
    } & RawAccountResponse>('/accounts', {
      method: 'POST',
      body: JSON.stringify(buildBackendAccountBody(payload)),
    });

    const created: RawAccountResponse = data?.account ?? data?.data ?? data;
    return normalizeAccount(created);
  },

  async update(id: string, payload: AccountPayload): Promise<Account> {
    const data = await apiRequest<{
      account?: RawAccountResponse;
      data?: RawAccountResponse;
    } & RawAccountResponse>(`/accounts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...buildBackendAccountBody(payload),
        creditLimit:
          payload.type === 'credit_card' && payload.creditLimit !== undefined
            ? Number(payload.creditLimit)
            : null,
        institution: payload.institution?.trim() || null,
        accountNumberLast4: payload.accountNumberLast4?.trim() || null,
        notes: payload.notes?.trim() || null,
      }),
    });

    const updated: RawAccountResponse = data?.account ?? data?.data ?? data;
    return normalizeAccount(updated);
  },

  async setDefault(id: string): Promise<Account[]> {
    await apiRequest(`/accounts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ isDefault: true }),
    });

    return this.getAll();
  },

  /**
   * Adjusts an account's balance by `delta` (+amount for income, -amount for expense).
   */
  async adjustBalance(accountId: string, delta: number): Promise<Account | null> {
    if (!accountId || delta === 0 || Number.isNaN(delta)) {
      return null;
    }

    const current = await apiRequest<{ account: RawAccountResponse }>(
      `/accounts/${encodeURIComponent(accountId)}`
    );
    const currentBalance = Number(current.account?.balance) || 0;
    const nextBalance = Number((currentBalance + delta).toFixed(2));

    const data = await apiRequest<{ account: RawAccountResponse }>(
      `/accounts/${encodeURIComponent(accountId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ balance: nextBalance }),
      }
    );

    return normalizeAccount(data.account);
  },

  /**
   * Moves `amount` from `fromAccountId` to `toAccountId` via /transactions.
   */
  async transfer(payload: TransferPayload): Promise<Account[]> {
    await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'transfer',
        accountId: payload.fromAccountId,
        toAccountId: payload.toAccountId,
        amount: Number(payload.amount),
        title: payload.note?.trim() || 'Account Transfer',
        date: payload.date,
        ...(payload.note?.trim() ? { notes: payload.note.trim() } : {}),
      }),
    });

    return this.getAll();
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/accounts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};