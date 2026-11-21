import { useState, useEffect, useCallback, useMemo } from 'react';
import { accountService } from '../services/accountService';
import type {
  Account,
  AccountPayload,
  AccountType,
  TransferPayload,
} from '../types/account.types';

export type AccountFilterTab = 'all' | AccountType;

export interface AccountsSummary {
  combinedBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  liquidCashAndBank: number;
  savingsTotal: number;
  accountCount: number;
}

export interface UseAccountsReturn {
  accounts: Account[];
  filteredAccounts: Account[];
  defaultAccount: Account | null;
  typeFilter: AccountFilterTab;
  setTypeFilter: (tab: AccountFilterTab) => void;
  summary: AccountsSummary;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createAccount: (payload: AccountPayload) => Promise<Account>;
  updateAccount: (id: string, payload: AccountPayload) => Promise<Account>;
  setDefaultAccount: (id: string) => Promise<void>;
  transferFunds: (payload: TransferPayload) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [typeFilter, setTypeFilter] = useState<AccountFilterTab>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await accountService.getAll();
      setAccounts(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load accounts. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Default account (or first available account) for transaction forms
  const defaultAccount = useMemo<Account | null>(() => {
    if (accounts.length === 0) return null;
    return accounts.find((acc) => acc.isDefault) ?? accounts[0];
  }, [accounts]);

  // Filtered accounts sorted with default account first
  const filteredAccounts = useMemo(() => {
    const matching =
      typeFilter === 'all'
        ? accounts
        : accounts.filter((acc) => acc.type === typeFilter);

    return [...matching].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b.balance - a.balance;
    });
  }, [accounts, typeFilter]);

  // Combined balance & asset/liability aggregates
  const summary = useMemo<AccountsSummary>(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let liquidCashAndBank = 0;
    let savingsTotal = 0;

    for (const acc of accounts) {
      if (acc.type === 'credit_card') {
        // Positive balance on a credit card represents owed statement balance
        if (acc.balance > 0) {
          totalLiabilities += acc.balance;
        } else {
          totalAssets += Math.abs(acc.balance);
        }
      } else {
        totalAssets += acc.balance;
        if (acc.type === 'savings') {
          savingsTotal += acc.balance;
        } else {
          liquidCashAndBank += acc.balance;
        }
      }
    }

    const combinedBalance = Number(
      (totalAssets - totalLiabilities).toFixed(2)
    );

    return {
      combinedBalance,
      totalAssets: Number(totalAssets.toFixed(2)),
      totalLiabilities: Number(totalLiabilities.toFixed(2)),
      liquidCashAndBank: Number(liquidCashAndBank.toFixed(2)),
      savingsTotal: Number(savingsTotal.toFixed(2)),
      accountCount: accounts.length,
    };
  }, [accounts]);

  const createAccount = useCallback(async (payload: AccountPayload) => {
    try {
      setIsMutating(true);
      const created = await accountService.create(payload);
      setAccounts((prev) => {
        if (created.isDefault) {
          return [
            created,
            ...prev.map((item) => ({ ...item, isDefault: false })),
          ];
        }
        return [created, ...prev];
      });
      return created;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateAccount = useCallback(
    async (id: string, payload: AccountPayload) => {
      try {
        setIsMutating(true);
        const updated = await accountService.update(id, payload);
        setAccounts((prev) =>
          prev.map((item) => {
            if (item.id === id) return updated;
            if (updated.isDefault) return { ...item, isDefault: false };
            return item;
          })
        );
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const setDefaultAccount = useCallback(async (id: string) => {
    try {
      setIsMutating(true);
      const nextList = await accountService.setDefault(id);
      setAccounts(nextList);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const transferFunds = useCallback(async (payload: TransferPayload) => {
    try {
      setIsMutating(true);
      const nextList = await accountService.transfer(payload);
      setAccounts(nextList);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      setIsMutating(true);
      await accountService.remove(id);
      setAccounts((prev) => {
        const remaining = prev.filter((item) => item.id !== id);
        if (remaining.length > 0 && !remaining.some((acc) => acc.isDefault)) {
          remaining[0] = { ...remaining[0], isDefault: true };
        }
        return remaining;
      });
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    accounts,
    filteredAccounts,
    defaultAccount,
    typeFilter,
    setTypeFilter,
    summary,
    isLoading,
    isMutating,
    error,
    refetch: fetchAccounts,
    createAccount,
    updateAccount,
    setDefaultAccount,
    transferFunds,
    deleteAccount,
  };
}