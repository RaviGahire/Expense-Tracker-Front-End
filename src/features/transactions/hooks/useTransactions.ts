import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  transactionService,
  type TransactionSubmitPayload,
} from '../services/transactionService';
import type { TransactionRecord } from '../components/TransactionItem';
import {
  INITIAL_TRANSACTION_FILTERS,
  countActiveFilters,
  type TransactionFilterState,
} from '../components/TransactionFilters';

export interface FilteredTotals {
  income: number;
  expense: number;
  net: number;
}

export interface UseTransactionsReturn {
  transactions: TransactionRecord[];
  filteredTransactions: TransactionRecord[];
  paginatedTransactions: TransactionRecord[];
  filters: TransactionFilterState;
  setFilters: (nextFilters: TransactionFilterState) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  totals: FilteredTotals;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTransaction: (payload: TransactionSubmitPayload) => Promise<void>;
  updateTransaction: (
    id: string,
    payload: TransactionSubmitPayload
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export function useTransactions(initialPageSize: number = 10): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [filters, setFiltersState] = useState<TransactionFilterState>(
    INITIAL_TRANSACTION_FILTERS
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await transactionService.getAll();
      setTransactions(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load transactions. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const setFilters = useCallback((nextFilters: TransactionFilterState) => {
    setFiltersState(nextFilters);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(INITIAL_TRANSACTION_FILTERS);
    setCurrentPage(1);
  }, []);

  const setPageSize = useCallback((nextSize: number) => {
    setPageSizeState(nextSize);
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(
    () => countActiveFilters(filters) > 0,
    [filters]
  );

  // Filter + Sort pipeline
  const filteredTransactions = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    const matched = transactions.filter((tx) => {
      if (filters.type !== 'all' && tx.type !== filters.type) {
        return false;
      }
      if (filters.category !== 'all' && tx.category !== filters.category) {
        return false;
      }
      if (
        filters.paymentMethod !== 'all' &&
        tx.paymentMethod !== filters.paymentMethod
      ) {
        return false;
      }
      if (filters.dateFrom && tx.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && tx.date > filters.dateTo) {
        return false;
      }
      if (query) {
        const haystack = [
          tx.title,
          tx.category,
          tx.paymentMethod,
          tx.notes ?? '',
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });

    return [...matched].sort((a, b) => {
      switch (filters.sortBy) {
        case 'date_asc':
          return a.date.localeCompare(b.date);
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        case 'date_desc':
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [transactions, filters]);

  // Filtered summary totals
  const totals = useMemo<FilteredTotals>(() => {
    let income = 0;
    let expense = 0;

    for (const tx of filteredTransactions) {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    }

    return {
      income,
      expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  // Clamp currentPage safely if deletions or filters shrink totalPages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize)
  );
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, safePage, pageSize]);

  const createTransaction = useCallback(
    async (payload: TransactionSubmitPayload) => {
      try {
        setIsMutating(true);
        const created = await transactionService.create(payload);
        setTransactions((prev) => [created, ...prev]);
        setCurrentPage(1);
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const updateTransaction = useCallback(
    async (id: string, payload: TransactionSubmitPayload) => {
      try {
        setIsMutating(true);
        const existing =
          transactions.find((item) => item.id === id) ?? null;
        const updated = await transactionService.update(
          id,
          payload,
          existing
        );
        setTransactions((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      } finally {
        setIsMutating(false);
      }
    },
    [transactions]
  );

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setIsMutating(true);
      await transactionService.remove(id);
      setTransactions((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    transactions,
    filteredTransactions,
    paginatedTransactions,
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    totals,
    currentPage: safePage,
    setCurrentPage,
    pageSize,
    setPageSize,
    isLoading,
    isMutating,
    error,
    refetch: fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}