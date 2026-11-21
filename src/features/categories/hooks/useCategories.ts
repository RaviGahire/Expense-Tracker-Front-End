import { useState, useEffect, useCallback, useMemo } from 'react';
import { categoryService } from '../services/categoryService';
import type { CategoryOptionItem } from '../components/CategorySelect';
import type { CategoryPayload } from '../components/CategoryManager';

export interface CategoryCounts {
  total: number;
  expense: number;
  income: number;
  custom: number;
  defaultCount: number;
}

export interface UseCategoriesReturn {
  categories: CategoryOptionItem[];
  expenseCategories: CategoryOptionItem[];
  incomeCategories: CategoryOptionItem[];
  customCategories: CategoryOptionItem[];
  counts: CategoryCounts;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCategory: (payload: CategoryPayload) => Promise<CategoryOptionItem>;
  updateCategory: (
    id: string,
    payload: CategoryPayload
  ) => Promise<CategoryOptionItem>;
  deleteCategory: (id: string) => Promise<void>;
  resetCategories: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<CategoryOptionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await categoryService.getAll();
      setCategories(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load categories. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const expenseCategories = useMemo(
    () => categories.filter((item) => item.type === 'expense'),
    [categories]
  );

  const incomeCategories = useMemo(
    () => categories.filter((item) => item.type === 'income'),
    [categories]
  );

  const customCategories = useMemo(
    () => categories.filter((item) => !item.isDefault),
    [categories]
  );

  const counts = useMemo<CategoryCounts>(
    () => ({
      total: categories.length,
      expense: expenseCategories.length,
      income: incomeCategories.length,
      custom: customCategories.length,
      defaultCount: categories.length - customCategories.length,
    }),
    [
      categories.length,
      expenseCategories.length,
      incomeCategories.length,
      customCategories.length,
    ]
  );

  const createCategory = useCallback(
    async (payload: CategoryPayload): Promise<CategoryOptionItem> => {
      try {
        setIsMutating(true);
        const created = await categoryService.create(payload);
        setCategories((prev) => [created, ...prev]);
        return created;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const updateCategory = useCallback(
    async (
      id: string,
      payload: CategoryPayload
    ): Promise<CategoryOptionItem> => {
      try {
        setIsMutating(true);
        const updated = await categoryService.update(id, payload);
        setCategories((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      setIsMutating(true);
      await categoryService.remove(id);
      setCategories((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setIsMutating(false);
    }
  }, []);

  const resetCategories = useCallback(async (): Promise<void> => {
    try {
      setIsMutating(true);
      const defaults = await categoryService.resetToDefaults();
      setCategories(defaults);
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    categories,
    expenseCategories,
    incomeCategories,
    customCategories,
    counts,
    isLoading,
    isMutating,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    resetCategories,
  };
}