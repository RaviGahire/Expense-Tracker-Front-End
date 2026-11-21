import type { CategoryColorToken } from '../../categories/components/CategoryIcon';

export type AccountType =
  | 'cash'
  | 'bank'
  | 'credit_card'
  | 'wallet'
  | 'savings';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number; // Optional limit when type === 'credit_card'
  institution?: string; // e.g., HDFC Bank, Paytm, Cash
  accountNumberLast4?: string;
  color: CategoryColorToken;
  iconName?: string;
  isDefault?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountPayload {
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number;
  institution?: string;
  accountNumberLast4?: string;
  color: CategoryColorToken;
  iconName?: string;
  isDefault?: boolean;
  notes?: string;
}

export interface TransferPayload {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  note?: string;
}