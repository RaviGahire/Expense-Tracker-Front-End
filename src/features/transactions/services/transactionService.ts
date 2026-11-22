import { apiRequest } from '../../../services/apiClient';
import { authService } from '../../auth/services/authService';
import { accountService } from '../../accounts/services/accountService';
import { categoryService } from '../../categories/services/categoryService';
import type { TransactionFormValues } from '../components/TransactionForm';
import type { TransactionRecord } from '../components/TransactionItem';

export type TransactionSubmitPayload = TransactionFormValues & {
  accountId?: string;
  toAccountId?: string;
  categoryId?: string;
  attachment?: File | null;
  removeExistingAttachment?: boolean;
};

interface RawTransactionResponse {
  id?: string;
  _id?: string;
  title?: string;
  amount?: number | string;
  type?: 'income' | 'expense' | 'transfer';
  category?: string;
  categoryId?: string | { _id?: string; id?: string; name?: string; label?: string };
  accountId?: string | { _id?: string; id?: string; name?: string };
  toAccountId?: string | { _id?: string; id?: string; name?: string };
  paymentMethod?: string;
  date?: string;
  notes?: string;
  recurring?: TransactionRecord['recurring'];
  existingAttachment?: TransactionRecord['existingAttachment'];
}

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function ensureAuthenticatedHeaders(): Record<string, string> {
  const token =
    authService.getToken() ||
    localStorage.getItem('expense_tracker_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token');

  if (!token) {
    authService.logout();
    window.location.href = '/login';
    throw new Error('Session expired or token is missing. Please log in again.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function extractName(
  ref?: string | { name?: string; label?: string } | null
): string | undefined {
  if (!ref || typeof ref === 'string') return undefined;
  return ref.label ?? ref.name;
}

function normalizeTransaction(raw: RawTransactionResponse): TransactionRecord {
  const categoryName =
    extractName(raw.categoryId) ??
    (raw.category && !OBJECT_ID_REGEX.test(raw.category) ? raw.category : undefined) ??
    'Uncategorized';

  const accountName =
    extractName(raw.accountId) ?? raw.paymentMethod ?? 'Account';

  const formattedDate = raw.date
    ? String(raw.date).slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    id: String(raw.id ?? raw._id ?? ''),
    title: String(raw.title ?? '').trim(),
    amount: Number(raw.amount) || 0,
    type: (raw.type === 'income' ? 'income' : 'expense') as TransactionRecord['type'],
    category: categoryName,
    paymentMethod: accountName as TransactionRecord['paymentMethod'],
    date: formattedDate,
    notes: raw.notes,
    recurring: raw.recurring,
    existingAttachment: raw.existingAttachment ?? null,
  };
}

async function resolveBackendPayload(payload: TransactionSubmitPayload) {
  let accountId = payload.accountId;
  let categoryId =
    payload.categoryId ??
    (payload.category && OBJECT_ID_REGEX.test(payload.category)
      ? payload.category
      : undefined);

  // Resolve accountId from paymentMethod (or fall back to default/first account)
  if (!accountId || !OBJECT_ID_REGEX.test(accountId)) {
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
      throw new Error('Please create at least one account before adding transactions.');
    }
    accountId = matchedAccount.id;
  }

  // Resolve categoryId from category name if not already an ObjectId
  if (!categoryId && payload.category) {
    const categories = await categoryService.getAll();
    const catName = payload.category.trim().toLowerCase();
    const matchedCategory =
      categories.find(
        (c) =>
          c.type === payload.type &&
          (c.label.toLowerCase() === catName || c.value.toLowerCase() === catName)
      ) ??
      categories.find(
        (c) =>
          c.label.toLowerCase() === catName || c.value.toLowerCase() === catName
      );

    if (matchedCategory?.id && OBJECT_ID_REGEX.test(matchedCategory.id)) {
      categoryId = matchedCategory.id;
    }
  }

  return {
    title: payload.title.trim(),
    amount: Number(payload.amount),
    type: payload.type,
    accountId,
    ...(payload.toAccountId ? { toAccountId: payload.toAccountId } : {}),
    ...(categoryId ? { categoryId } : {}),
    paymentMethod: payload.paymentMethod,
    date: payload.date,
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
    ...(payload.recurring?.isRecurring ? { recurring: payload.recurring } : {}),
  };
}

export function buildTransactionFormData(
  values: TransactionSubmitPayload,
  resolvedBody?: Record<string, unknown>
): FormData {
  const formData = new FormData();
  const body = resolvedBody ?? values;

  formData.append('title', String(body.title ?? values.title));
  formData.append('amount', String(body.amount ?? values.amount));
  formData.append('type', String(body.type ?? values.type));
  if (body.accountId) formData.append('accountId', String(body.accountId));
  if (body.toAccountId) formData.append('toAccountId', String(body.toAccountId));
  if (body.categoryId) formData.append('categoryId', String(body.categoryId));
  if (values.category) formData.append('category', values.category);
  if (values.paymentMethod) formData.append('paymentMethod', values.paymentMethod);
  formData.append('date', String(body.date ?? values.date));

  if (values.notes) {
    formData.append('notes', values.notes);
  }
  if (values?.recurring?.isRecurring) {
    formData.append('recurring', JSON.stringify(values.recurring));
  }
  if (values.attachment) {
    formData.append('attachment', values.attachment);
  }
  if (values.removeExistingAttachment) {
    formData.append('removeAttachment', 'true');
  }

  return formData;
}

export const transactionService = {
  isRemoteEnabled(): boolean {
    return true;
  },

  async getAll(queryString: string = ''): Promise<TransactionRecord[]> {
    const authHeaders = ensureAuthenticatedHeaders();
    const suffix = queryString
      ? queryString.startsWith('?')
        ? queryString
        : `?${queryString}`
      : '';

    const data = await apiRequest<
      | { transactions?: RawTransactionResponse[]; data?: RawTransactionResponse[] }
      | RawTransactionResponse[]
    >(`/transactions${suffix}`, {
      headers: authHeaders,
    });

    const list: RawTransactionResponse[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.transactions)
      ? data.transactions
      : Array.isArray(data?.data)
      ? data.data
      : [];

    return list.map(normalizeTransaction);
  },

  async create(payload: TransactionSubmitPayload): Promise<TransactionRecord> {
    const authHeaders = ensureAuthenticatedHeaders();
    const resolvedBody = await resolveBackendPayload(payload);
    const hasFile = Boolean(payload.attachment);

    const data = await apiRequest<
      { transaction?: RawTransactionResponse; data?: RawTransactionResponse } & RawTransactionResponse
    >('/transactions', {
      method: 'POST',
      headers: authHeaders,
      body: hasFile
        ? buildTransactionFormData(payload, resolvedBody)
        : JSON.stringify(resolvedBody),
    });

    const created = (data.transaction ?? data.data ?? data) as RawTransactionResponse;
    return normalizeTransaction({
      ...created,
      category: created.category ?? payload.category,
      paymentMethod: created.paymentMethod ?? payload.paymentMethod,
    });
  },

  async update(
    id: string,
    payload: TransactionSubmitPayload,
    _currentRecord?: TransactionRecord | null
  ): Promise<TransactionRecord> {
    const authHeaders = ensureAuthenticatedHeaders();
    const resolvedBody = await resolveBackendPayload(payload);
    const hasMultipart = Boolean(
      payload.attachment || payload.removeExistingAttachment
    );

    const data = await apiRequest<
      { transaction?: RawTransactionResponse; data?: RawTransactionResponse } & RawTransactionResponse
    >(`/transactions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: hasMultipart
        ? buildTransactionFormData(payload, resolvedBody)
        : JSON.stringify(resolvedBody),
    });

    const updated = (data.transaction ?? data.data ?? data) as RawTransactionResponse;
    return normalizeTransaction({
      ...updated,
      category: updated.category ?? payload.category,
      paymentMethod: updated.paymentMethod ?? payload.paymentMethod,
    });
  },

  async remove(id: string): Promise<void> {
    const authHeaders = ensureAuthenticatedHeaders();
    await apiRequest<void>(`/transactions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
  },
};