import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import {
  IconChevronDown,
  IconCheck,
  IconSearch,
  IconPlus,
  IconTag,
  IconAlertCircle,
  IconToolsKitchen3 ,
  IconHome,
  IconCar,
  IconShoppingBag,
  IconBolt,
  IconBriefcase,
  IconDeviceLaptop,
  IconHeartbeat,
  IconBook,
  IconGift,
  IconTrendingUp,
  IconMovie,
  IconReceiptRefund,
  IconCategory,
} from '@tabler/icons-react';

export type CategoryFlowType = 'expense' | 'income';

export type CategoryColorToken =
  | 'brand'
  | 'income'
  | 'expense'
  | 'warning'
  | 'accent'
  | 'neutral';

export interface CategoryOptionItem {
  id?: string;
  value: string;
  label: string;
  type: CategoryFlowType;
  color?: CategoryColorToken;
  iconName?: string;
  isDefault?: boolean;
}

export interface CategorySelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  categories?: CategoryOptionItem[];
  filterByType?: CategoryFlowType | 'all';
  includeAllOption?: boolean;
  allOptionLabel?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  searchable?: boolean;
  onCreateCategory?: () => void;
  createCategoryLabel?: string;
  className?: string;
}

export const DEFAULT_CATEGORY_OPTIONS: CategoryOptionItem[] = [
  // Expense Categories
  {
    id: 'cat_exp_food',
    value: 'Food & Dining',
    label: 'Food & Dining',
    type: 'expense',
    color: 'warning',
    iconName: 'utensils',
    isDefault: true,
  },
  {
    id: 'cat_exp_housing',
    value: 'Housing & Rent',
    label: 'Housing & Rent',
    type: 'expense',
    color: 'brand',
    iconName: 'home',
    isDefault: true,
  },
  {
    id: 'cat_exp_transport',
    value: 'Transport & Fuel',
    label: 'Transport & Fuel',
    type: 'expense',
    color: 'accent',
    iconName: 'car',
    isDefault: true,
  },
  {
    id: 'cat_exp_bills',
    value: 'Bills & Utilities',
    label: 'Bills & Utilities',
    type: 'expense',
    color: 'warning',
    iconName: 'bolt',
    isDefault: true,
  },
  {
    id: 'cat_exp_shopping',
    value: 'Shopping',
    label: 'Shopping',
    type: 'expense',
    color: 'expense',
    iconName: 'shopping',
    isDefault: true,
  },
  {
    id: 'cat_exp_health',
    value: 'Health & Medical',
    label: 'Health & Medical',
    type: 'expense',
    color: 'expense',
    iconName: 'health',
    isDefault: true,
  },
  {
    id: 'cat_exp_entertainment',
    value: 'Entertainment',
    label: 'Entertainment',
    type: 'expense',
    color: 'accent',
    iconName: 'movie',
    isDefault: true,
  },
  {
    id: 'cat_exp_education',
    value: 'Education',
    label: 'Education',
    type: 'expense',
    color: 'brand',
    iconName: 'book',
    isDefault: true,
  },
  {
    id: 'cat_exp_other',
    value: 'Other Expense',
    label: 'Other Expense',
    type: 'expense',
    color: 'neutral',
    iconName: 'category',
    isDefault: true,
  },

  // Income Categories
  {
    id: 'cat_inc_salary',
    value: 'Salary',
    label: 'Salary',
    type: 'income',
    color: 'income',
    iconName: 'briefcase',
    isDefault: true,
  },
  {
    id: 'cat_inc_freelance',
    value: 'Freelance',
    label: 'Freelance',
    type: 'income',
    color: 'income',
    iconName: 'laptop',
    isDefault: true,
  },
  {
    id: 'cat_inc_investments',
    value: 'Investments',
    label: 'Investments',
    type: 'income',
    color: 'brand',
    iconName: 'trending',
    isDefault: true,
  },
  {
    id: 'cat_inc_bonus',
    value: 'Bonus & Gifts',
    label: 'Bonus & Gifts',
    type: 'income',
    color: 'warning',
    iconName: 'gift',
    isDefault: true,
  },
  {
    id: 'cat_inc_refunds',
    value: 'Refunds',
    label: 'Refunds',
    type: 'income',
    color: 'accent',
    iconName: 'refund',
    isDefault: true,
  },
  {
    id: 'cat_inc_other',
    value: 'Other Income',
    label: 'Other Income',
    type: 'income',
    color: 'income',
    iconName: 'category',
    isDefault: true,
  },
];

const COLOR_TOKEN_CLASSES: Record<CategoryColorToken, string> = {
  brand: 'bg-brand/15 text-brand',
  income: 'bg-income/15 text-income',
  expense: 'bg-expense/15 text-expense',
  warning: 'bg-warning/15 text-warning',
  accent: 'bg-accent/15 text-accent',
  neutral: 'bg-surface-elevated text-ink-secondary',
};

export function renderCategoryIcon(
  option: Pick<CategoryOptionItem, 'label' | 'type' | 'color' | 'iconName'>
): { icon: ReactNode; badgeClass: string } {
  const key = (option.iconName || option.label).trim().toLowerCase();

  let resolvedColor: CategoryColorToken =
    option.color || (option.type === 'income' ? 'income' : 'neutral');

  if (!option.color && option.type === 'expense') {
    if (key.includes('food') || key.includes('utensil') || key.includes('bolt')) {
      resolvedColor = 'warning';
    } else if (key.includes('home') || key.includes('rent') || key.includes('book')) {
      resolvedColor = 'brand';
    } else if (key.includes('car') || key.includes('transport') || key.includes('movie')) {
      resolvedColor = 'accent';
    } else if (key.includes('shop') || key.includes('health')) {
      resolvedColor = 'expense';
    }
  }

  const badgeClass = COLOR_TOKEN_CLASSES[resolvedColor];

  if (key.includes('utensil') || key.includes('food') || key.includes('dining')) {
    return { icon: <IconToolsKitchen3  className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('home') || key.includes('rent') || key.includes('housing')) {
    return { icon: <IconHome className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('car') || key.includes('transport') || key.includes('fuel')) {
    return { icon: <IconCar className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('shop')) {
    return { icon: <IconShoppingBag className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('bolt') || key.includes('bill') || key.includes('utilit')) {
    return { icon: <IconBolt className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('briefcase') || key.includes('salary')) {
    return { icon: <IconBriefcase className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('laptop') || key.includes('freelance')) {
    return { icon: <IconDeviceLaptop className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('health') || key.includes('medical')) {
    return { icon: <IconHeartbeat className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('book') || key.includes('educat')) {
    return { icon: <IconBook className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('gift') || key.includes('bonus')) {
    return { icon: <IconGift className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('trend') || key.includes('invest')) {
    return { icon: <IconTrendingUp className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('movie') || key.includes('entertain')) {
    return { icon: <IconMovie className="h-4 w-4" stroke={1.75} />, badgeClass };
  }
  if (key.includes('refund')) {
    return { icon: <IconReceiptRefund className="h-4 w-4" stroke={1.75} />, badgeClass };
  }

  return {
    icon: <IconCategory className="h-4 w-4" stroke={1.75} />,
    badgeClass,
  };
}

export function CategorySelect({
  label,
  value,
  onChange,
  categories = DEFAULT_CATEGORY_OPTIONS,
  filterByType = 'all',
  includeAllOption = false,
  allOptionLabel = 'All Categories',
  placeholder = 'Select a category',
  error,
  helperText,
  disabled = false,
  searchable = true,
  onCreateCategory,
  createCategoryLabel = '+ Create new category',
  className = '',
}: CategorySelectProps) {
  const triggerId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  // Scope categories by transaction type ('expense' | 'income' | 'all')
  const scopedCategories = useMemo(() => {
    if (filterByType === 'all') return categories;
    return categories.filter((item) => item.type === filterByType);
  }, [categories, filterByType]);

  // Filter options by search query inside the dropdown
  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return scopedCategories;

    return scopedCategories.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
    );
  }, [scopedCategories, searchQuery]);

  // Build flat selectable list including optional 'all' entry at index 0
  const selectableItems = useMemo(() => {
    const items: Array<
      | { kind: 'all'; value: 'all'; label: string }
      | { kind: 'category'; item: CategoryOptionItem }
    > = [];

    if (includeAllOption && !searchQuery.trim()) {
      items.push({ kind: 'all', value: 'all', label: allOptionLabel });
    }

    for (const cat of filteredOptions) {
      items.push({ kind: 'category', item: cat });
    }

    return items;
  }, [includeAllOption, allOptionLabel, filteredOptions, searchQuery]);

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (cat) => cat.value.toLowerCase() === value.trim().toLowerCase()
      ) ?? null,
    [categories, value]
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Focus search input when menu opens and sync highlighted index to current value
  useEffect(() => {
    if (!isOpen) return;

    const activeIdx = selectableItems.findIndex((entry) =>
      entry.kind === 'all'
        ? value === 'all'
        : entry.item.value.toLowerCase() === value.trim().toLowerCase()
    );
    setHighlightedIndex(activeIdx >= 0 ? activeIdx : 0);

    if (searchable) {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, searchable, selectableItems, value]);

  const handleSelectValue = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (
        e.key === 'Enter' ||
        e.key === ' ' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp'
      ) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        selectableItems.length > 0 ? (prev + 1) % selectableItems.length : 0
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        selectableItems.length > 0
          ? (prev - 1 + selectableItems.length) % selectableItems.length
          : 0
      );
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      setHighlightedIndex(Math.max(0, selectableItems.length - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const target = selectableItems[highlightedIndex];
      if (target) {
        handleSelectValue(
          target.kind === 'all' ? target.value : target.item.value
        );
      }
    }
  };

  const selectedVisual = selectedCategory
    ? renderCategoryIcon(selectedCategory)
    : null;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Optional Field Label */}
      {label && (
        <label
          htmlFor={triggerId}
          className="mb-1.5 block text-xs font-medium text-ink-secondary"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`flex h-10 w-full items-center justify-between gap-2.5 rounded-xl border bg-surface px-3 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? 'border-expense focus-visible:ring-expense/25'
            : isOpen
            ? 'border-brand ring-2 ring-brand/25'
            : 'border-subtle hover:border-ink-muted/50 focus-visible:border-brand focus-visible:ring-brand/25'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {value === 'all' && includeAllOption ? (
            <>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-ink-secondary">
                <IconTag className="h-3.5 w-3.5" stroke={1.75} />
              </span>
              <span className="truncate font-medium text-ink-primary">
                {allOptionLabel}
              </span>
            </>
          ) : selectedCategory && selectedVisual ? (
            <>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${selectedVisual.badgeClass}`}
              >
                {selectedVisual.icon}
              </span>
              <span className="truncate font-medium text-ink-primary">
                {selectedCategory.label}
              </span>
            </>
          ) : (
            <>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-ink-muted">
                <IconTag className="h-3.5 w-3.5" stroke={1.75} />
              </span>
              <span className="truncate text-ink-muted">{placeholder}</span>
            </>
          )}
        </div>

        <IconChevronDown
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand' : ''
          }`}
          stroke={1.75}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          onKeyDown={handleKeyDown}
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-2xl border border-subtle bg-surface shadow-xl"
        >
          {/* Optional Search Input */}
          {searchable && (
            <div className="border-b border-subtle p-2">
              <div className="relative">
                <IconSearch
                  className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
                  stroke={1.75}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder="Filter categories..."
                  aria-label="Filter categories"
                  className="h-8 w-full rounded-lg border border-subtle bg-surface-elevated/70 pr-2.5 pl-8 text-xs text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5">
            {selectableItems.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-ink-muted">
                No categories match "{searchQuery}".
              </div>
            ) : (
              selectableItems.map((entry, idx) => {
                const isHighlighted = idx === highlightedIndex;

                if (entry.kind === 'all') {
                  const isSelected = value === 'all';
                  return (
                    <button
                      key="__all__"
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelectValue('all')}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-brand/15 font-semibold text-brand'
                          : isHighlighted
                          ? 'bg-surface-elevated text-ink-primary'
                          : 'text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-ink-secondary">
                          <IconTag className="h-3.5 w-3.5" stroke={1.75} />
                        </span>
                        <span>{entry.label}</span>
                      </div>

                      {isSelected && (
                        <IconCheck className="h-4 w-4 shrink-0 text-brand" stroke={2} />
                      )}
                    </button>
                  );
                }

                const cat = entry.item;
                const isSelected =
                  cat.value.toLowerCase() === value.trim().toLowerCase();
                const visual = renderCategoryIcon(cat);

                return (
                  <button
                    key={cat.id || cat.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectValue(cat.value)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-brand/15 font-semibold text-brand'
                        : isHighlighted
                        ? 'bg-surface-elevated text-ink-primary'
                        : 'text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${visual.badgeClass}`}
                      >
                        {visual.icon}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-primary">
                          {cat.label}
                        </p>
                        {filterByType === 'all' && (
                          <p className="text-[10px] capitalize text-ink-muted">
                            {cat.type}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <IconCheck className="h-4 w-4 shrink-0 text-brand" stroke={2} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Optional Footer CTA to Create a Custom Category */}
          {onCreateCategory && (
            <div className="border-t border-subtle bg-surface-elevated/40 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                  onCreateCategory();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/10"
              >
                <IconPlus className="h-4 w-4" stroke={2} />
                <span>{createCategoryLabel.replace(/^\+\s*/, '')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Helper or Validation Error Text */}
      {error ? (
        <p
          role="alert"
          className="mt-1.5 flex items-center gap-1 text-xs text-expense"
        >
          <IconAlertCircle className="h-3.5 w-3.5 shrink-0" stroke={2} />
          <span>{error}</span>
        </p>
      ) : (
        helperText && (
          <p className="mt-1.5 text-xs text-ink-muted">{helperText}</p>
        )
      )}
    </div>
  );
}