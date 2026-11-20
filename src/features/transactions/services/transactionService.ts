import { authService } from '../../auth/services/authService';
import type { TransactionFormValues } from '../components/TransactionForm';
import type { TransactionRecord } from '../components/TransactionItem';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders(includeJsonContentType: boolean = true): HeadersInit {
  const token = authService.getToken();
  return {
    ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function buildTransactionFormData(
  values: TransactionFormValues & {
    attachment?: File | null;
    removeExistingAttachment?: boolean;
  }
): FormData {
  const formData = new FormData();
  formData.append('title', values.title);
  formData.append('amount', String(values.amount));
  formData.append('type', values.type);
  formData.append('category', values.category);
  formData.append('paymentMethod', values.paymentMethod);
  formData.append('date', values.date);

  if (values.notes) {
    formData.append('notes', values.notes);
  }
  if (values?.recurring?.isRecurring) {
    formData.append('recurring', JSON.stringify(values?.recurring));
  }
  if (values.attachment) {
    formData.append('attachment', values.attachment);
  }
  if (values.removeExistingAttachment) {
    formData.append('removeAttachment', 'true');
  }

  return formData;
}

const INITIAL_MOCK_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx_101',
    title: 'Monthly Tech Salary',
    amount: 95000,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'Bank Transfer',
    date: '2026-11-01',
    notes: 'November payroll deposit',
    recurring: {
      isRecurring: true,
      frequency: 'monthly',
      nextDate: '2026-12-01',
    },
  },
  {
    id: 'tx_102',
    title: 'Apartment Rent - Pune',
    amount: 18000,
    type: 'expense',
    category: 'Housing & Rent',
    paymentMethod: 'UPI',
    date: '2026-11-05',
    notes: '2BHK monthly rent transfer',
    recurring: {
      isRecurring: true,
      frequency: 'monthly',
      nextDate: '2026-12-05',
    },
  },
  {
    id: 'tx_103',
    title: 'Fresh Mart Superstore',
    amount: 3450,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'UPI',
    date: '2026-11-12',
    notes: 'Weekly groceries and pantry supplies',
  },
  {
    id: 'tx_104',
    title: 'Freelance UI Audit',
    amount: 14500,
    type: 'income',
    category: 'Freelance',
    paymentMethod: 'Bank Transfer',
    date: '2026-11-15',
    notes: 'Design system review milestone #2',
  },
  {
    id: 'tx_105',
    title: 'MSEDCL Electricity & Fiber Internet',
    amount: 2680,
    type: 'expense',
    category: 'Bills & Utilities',
    paymentMethod: 'Debit Card',
    date: '2026-11-18',
    recurring: {
      isRecurring: true,
      frequency: 'monthly',
      nextDate: '2026-12-18',
    },
  },
  {
    id: 'tx_106',
    title: 'IndianOil Fuel Refill',
    amount: 2200,
    type: 'expense',
    category: 'Transport & Fuel',
    paymentMethod: 'Credit Card',
    date: '2026-11-19',
  },
  {
    id: 'tx_107',
    title: 'Mechanical Keyboard & Desk Mat',
    amount: 6400,
    type: 'expense',
    category: 'Shopping',
    paymentMethod: 'Credit Card',
    date: '2026-11-20',
    notes: 'Home office workstation upgrade',
  },
];

export type TransactionSubmitPayload = TransactionFormValues & {
  attachment?: File | null;
  removeExistingAttachment?: boolean;
};

export const transactionService = {
  isRemoteEnabled(): boolean {
    return Boolean(API_BASE_URL);
  },

  async getAll(): Promise<TransactionRecord[]> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: 'GET',
        headers: getAuthHeaders(true),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load transactions.');
      }

      return (Array.isArray(data) ? data : data.transactions) as TransactionRecord[];
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    return [...INITIAL_MOCK_TRANSACTIONS];
  },

  async create(payload: TransactionSubmitPayload): Promise<TransactionRecord> {
    if (API_BASE_URL) {
      const hasFile = Boolean(payload.attachment);
      const response = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(!hasFile),
        body: hasFile
          ? buildTransactionFormData(payload)
          : JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create transaction.');
      }

      return (data.transaction ?? data) as TransactionRecord;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      id: `tx_${Date.now()}`,
      title: payload.title,
      amount: payload.amount,
      type: payload.type,
      category: payload.category,
      paymentMethod: payload.paymentMethod,
      date: payload.date,
      notes: payload.notes,
      recurring: payload.recurring,
      existingAttachment: payload.attachment
        ? {
            name: payload.attachment.name,
            url: URL.createObjectURL(payload.attachment),
            mimeType: payload.attachment.type,
            sizeBytes: payload.attachment.size,
          }
        : null,
    };
  },

  async update(
    id: string,
    payload: TransactionSubmitPayload,
    currentRecord?: TransactionRecord | null
  ): Promise<TransactionRecord> {
    if (API_BASE_URL) {
      const hasMultipart = Boolean(
        payload.attachment || payload.removeExistingAttachment
      );
      const response = await fetch(
        `${API_BASE_URL}/api/transactions/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(!hasMultipart),
          body: hasMultipart
            ? buildTransactionFormData(payload)
            : JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update transaction.');
      }

      return (data.transaction ?? data) as TransactionRecord;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    let nextAttachment = currentRecord?.existingAttachment ?? null;
    if (payload.removeExistingAttachment) {
      nextAttachment = null;
    }
    if (payload.attachment) {
      nextAttachment = {
        name: payload.attachment.name,
        url: URL.createObjectURL(payload.attachment),
        mimeType: payload.attachment.type,
        sizeBytes: payload.attachment.size,
      };
    }

    return {
      id,
      title: payload.title,
      amount: payload.amount,
      type: payload.type,
      category: payload.category,
      paymentMethod: payload.paymentMethod,
      date: payload.date,
      notes: payload.notes,
      recurring: payload.recurring,
      existingAttachment: nextAttachment,
    };
  },

  async remove(id: string): Promise<void> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/api/transactions/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(true),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete transaction.');
      }
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  },
};