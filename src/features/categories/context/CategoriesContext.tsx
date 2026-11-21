import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { categoryService } from '../services/categoryService';
import {
  DEFAULT_CATEGORY_OPTIONS,
  type CategoryOptionItem,
} from '../components/CategorySelect';
import type { CategoryPayload } from '../components/CategoryManager';
import type { CategoryCounts } from '../hooks/useCategories';

export interface CategoriesContextValue {
  categories: CategoryOptionItem[];
  expenseCategories: CategoryOptionItem[];
  incomeCategories: CategoryOptionItem[];
  customCategories: CategoryOptionItem[];
  counts: CategoryCounts;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getCategoryByValue: (value: string) => CategoryOptionItem | undefined;
  createCategory: (payload: CategoryPayload) => Promise<CategoryOptionItem>;
  updateCategory: (
    id: string,
    payload: CategoryPayload
  ) => Promise<CategoryOptionItem>;
  deleteCategory: (id: string) => Promise<void>;
  resetCategories: () => Promise<void>;
}

export const CategoriesContext = createContext<CategoriesContextValue | null>(
  null
);

function mergeDefaultsWithCustom(
  fetched: CategoryOptionItem[]
): CategoryOptionItem[] {
  if (!Array.isArray(fetched) || fetched.length === 0) {
    return [...DEFAULT_CATEGORY_OPTIONS];
  }

  // If the fetched list already contains built-in defaults (e.g., localStorage mode),
  // preserve its customized icons/colors and append any missing defaults.
  const fetchedByKey = new Map<string, CategoryOptionItem>();
  for (const item of fetched) {
    const key = `${item.type}:${item.value.trim().toLowerCase()}`;
    fetchedByKey.set(key, item);
  }

  const customItems = fetched.filter((item) => !item.isDefault);
  const resolvedDefaults = DEFAULT_CATEGORY_OPTIONS.map((def) => {
    const key = `${def.type}:${def.value.trim().toLowerCase()}`;
    return fetchedByKey.get(key) ?? def;
  });

  // Deduplicate custom items that might overlap with defaults
  const defaultKeys = new Set(
    resolvedDefaults.map((d) => `${d.type}:${d.value.trim().toLowerCase()}`)
  );
  const uniqueCustomItems = customItems.filter(
    (c) => !defaultKeys.has(`${c.type}:${c.value.trim().toLowerCase()}`)
  );

  return [...uniqueCustomItems, ...resolvedDefaults];
}

export interface CategoriesProviderProps {
  children: ReactNode;
}

export function CategoriesProvider({ children }: CategoriesProviderProps) {
  const [categories, setCategories] = useState<CategoryOptionItem[]>(() => [
    ...DEFAULT_CATEGORY_OPTIONS,
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetched = await categoryService.getAll();
      setCategories(mergeDefaultsWithCustom(fetched));
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
    refresh();
  }, [refresh]);

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

  const getCategoryByValue = useCallback(
    (value: string): CategoryOptionItem | undefined => {
      const normalized = value.trim().toLowerCase();
      return categories.find(
        (item) =>
          item.value.trim().toLowerCase() === normalized ||
          item.label.trim().toLowerCase() === normalized
      );
    },
    [categories]
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

  const contextValue = useMemo<CategoriesContextValue>(
    () => ({
      categories,
      expenseCategories,
      incomeCategories,
      customCategories,
      counts,
      isLoading,
      isMutating,
      error,
      refresh,
      getCategoryByValue,
      createCategory,
      updateCategory,
      deleteCategory,
      resetCategories,
    }),
    [
      categories,
      expenseCategories,
      incomeCategories,
      customCategories,
      counts,
      isLoading,
      isMutating,
      error,
      refresh,
      getCategoryByValue,
      createCategory,
      updateCategory,
      deleteCategory,
      resetCategories,
    ]
  );

  return (
    <CategoriesContext.Provider value={contextValue}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategoriesContext(): CategoriesContextValue {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error(
      'useCategoriesContext must be used inside a <CategoriesProvider>.'
    );
  }
  return context;
}