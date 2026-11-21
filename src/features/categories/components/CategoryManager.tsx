import { useState, useMemo, type FormEvent } from 'react';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconLock,
  IconTag,
  IconArrowDownRight,
  IconArrowUpRight,
  IconAlertCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import {
  DEFAULT_CATEGORY_OPTIONS,
  renderCategoryIcon,
  type CategoryOptionItem,
  type CategoryFlowType,
  type CategoryColorToken,
} from './CategorySelect';

export interface CategoryPayload {
  label: string;
  type: CategoryFlowType;
  color: CategoryColorToken;
  iconName: string;
}

export interface CategoryManagerProps {
  categories?: CategoryOptionItem[];
  onCreateCategory?: (payload: CategoryPayload) => Promise<void> | void;
  onUpdateCategory?: (
    id: string,
    payload: CategoryPayload
  ) => Promise<void> | void;
  onDeleteCategory?: (id: string) => Promise<void> | void;
  isLoading?: boolean;
  isMutating?: boolean;
}

type FilterTab = 'all' | 'expense' | 'income';

const ICON_CHOICES: { name: string; label: string }[] = [
  { name: 'utensils', label: 'Food' },
  { name: 'home', label: 'Housing' },
  { name: 'car', label: 'Transport' },
  { name: 'bolt', label: 'Utilities' },
  { name: 'shopping', label: 'Shopping' },
  { name: 'health', label: 'Health' },
  { name: 'movie', label: 'Leisure' },
  { name: 'book', label: 'Education' },
  { name: 'briefcase', label: 'Salary' },
  { name: 'laptop', label: 'Freelance' },
  { name: 'trending', label: 'Investing' },
  { name: 'gift', label: 'Bonus' },
  { name: 'refund', label: 'Refunds' },
  { name: 'category', label: 'General' },
];

const COLOR_CHOICES: {
  token: CategoryColorToken;
  label: string;
  swatchClass: string;
}[] = [
  { token: 'brand', label: 'Brand', swatchClass: 'bg-brand' },
  { token: 'income', label: 'Income', swatchClass: 'bg-income' },
  { token: 'expense', label: 'Expense', swatchClass: 'bg-expense' },
  { token: 'warning', label: 'Warning', swatchClass: 'bg-warning' },
  { token: 'accent', label: 'Accent', swatchClass: 'bg-accent' },
  { token: 'neutral', label: 'Neutral', swatchClass: 'bg-ink-secondary' },
];

export function CategoryManager({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  isLoading = false,
  isMutating = false,
}: CategoryManagerProps) {
  // Self-contained fallback state when external CRUD handlers aren't wired yet
  const [internalCategories, setInternalCategories] = useState<
    CategoryOptionItem[]
  >(() => DEFAULT_CATEGORY_OPTIONS);

  const activeCategories = categories ?? internalCategories;

  // Filter & Search state
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryOptionItem | null>(null);
  const [formLabel, setFormLabel] = useState<string>('');
  const [formType, setFormType] = useState<CategoryFlowType>('expense');
  const [formColor, setFormColor] = useState<CategoryColorToken>('brand');
  const [formIcon, setFormIcon] = useState<string>('category');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deletingCategory, setDeletingCategory] =
    useState<CategoryOptionItem | null>(null);

  const counts = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (const item of activeCategories) {
      if (item.type === 'expense') expense += 1;
      else income += 1;
    }
    return {
      all: activeCategories.length,
      expense,
      income,
    };
  }, [activeCategories]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activeCategories.filter((cat) => {
      if (activeTab !== 'all' && cat.type !== activeTab) {
        return false;
      }
      if (query && !cat.label.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [activeCategories, activeTab, searchQuery]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormLabel('');
    setFormType(activeTab === 'income' ? 'income' : 'expense');
    setFormColor(activeTab === 'income' ? 'income' : 'brand');
    setFormIcon(activeTab === 'income' ? 'briefcase' : 'category');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryOptionItem) => {
    setEditingCategory(category);
    setFormLabel(category.label);
    setFormType(category.type);
    setFormColor(
      category.color || (category.type === 'income' ? 'income' : 'brand')
    );
    setFormIcon(category.iconName || 'category');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isMutating) return;
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormError(null);
  };

  const handleSaveCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isMutating) return;

    const trimmedName = formLabel.trim();
    if (!trimmedName) {
      setFormError('Category name is required.');
      return;
    }
    if (trimmedName.length < 2) {
      setFormError('Category name must be at least 2 characters.');
      return;
    }

    // Check duplicate name within the same flow type
    const isDuplicate = activeCategories.some(
      (cat) =>
        cat.id !== editingCategory?.id &&
        cat.type === formType &&
        cat.label.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setFormError(
        `A ${formType} category named "${trimmedName}" already exists.`
      );
      return;
    }

    const payload: CategoryPayload = {
      label: trimmedName,
      type: formType,
      color: formColor,
      iconName: formIcon,
    };

    try {
      setFormError(null);

      if (editingCategory?.id) {
        if (onUpdateCategory) {
          await onUpdateCategory(editingCategory.id, payload);
        } else {
          setInternalCategories((prev) =>
            prev.map((item) =>
              item.id === editingCategory.id
                ? {
                    ...item,
                    value: payload.label,
                    label: payload.label,
                    type: payload.type,
                    color: payload.color,
                    iconName: payload.iconName,
                  }
                : item
            )
          );
        }
      } else {
        if (onCreateCategory) {
          await onCreateCategory(payload);
        } else {
          const created: CategoryOptionItem = {
            id: `cat_custom_${Date.now()}`,
            value: payload.label,
            label: payload.label,
            type: payload.type,
            color: payload.color,
            iconName: payload.iconName,
            isDefault: false,
          };
          setInternalCategories((prev) => [created, ...prev]);
        }
      }

      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Unable to save category. Please try again.'
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory?.id || isMutating) return;

    try {
      if (onDeleteCategory) {
        await onDeleteCategory(deletingCategory.id);
      } else {
        setInternalCategories((prev) =>
          prev.filter((item) => item.id !== deletingCategory.id)
        );
      }
      setDeletingCategory(null);
    } catch {
      setDeletingCategory(null);
    }
  };

  const previewVisual = renderCategoryIcon({
    label: formLabel || 'Category Preview',
    type: formType,
    color: formColor,
    iconName: formIcon,
  });

  return (
    <div className="space-y-6">
      {/* Toolbar: Segmented Filter Tabs + Search + Add Category Button */}
      <Card className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        {/* Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter categories by type"
          className="inline-flex w-full rounded-xl border border-subtle bg-surface-elevated/60 p-1 sm:w-auto"
        >
          {(
            [
              { key: 'all', label: 'All', count: counts.all },
              { key: 'expense', label: 'Expenses', count: counts.expense },
              { key: 'income', label: 'Income', count: counts.income },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors sm:flex-initial ${
                  isActive
                    ? 'bg-brand text-canvas shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    isActive
                      ? 'bg-canvas/20 text-canvas'
                      : 'bg-surface text-ink-muted'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Create Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Input
              aria-label="Search categories"
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<IconSearch className="h-4 w-4" stroke={1.75} />}
              className={searchQuery ? 'pr-9' : ''}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear category search"
                className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-elevated hover:text-ink-primary"
              >
                <IconX className="h-3.5 w-3.5" stroke={2} />
              </button>
            )}
          </div>

          <Button
            type="button"
            onClick={openCreateModal}
            leftIcon={<IconPlus className="h-4 w-4" stroke={2.25} />}
          >
            New Category
          </Button>
        </div>
      </Card>

      {/* Category Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((skeleton) => (
            <Card key={skeleton} className="animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-surface-elevated" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 rounded bg-surface-elevated" />
                    <div className="h-3 w-16 rounded bg-surface-elevated" />
                  </div>
                </div>
                <div className="h-8 w-16 rounded-lg bg-surface-elevated" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={<IconTag className="h-6 w-6" stroke={1.75} />}
          title="No categories found"
          description={
            searchQuery
              ? `No categories match "${searchQuery}". Try clearing your search or creating a new category.`
              : 'Create custom categories to organize your income and expenses.'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Create Category'}
          actionIcon={
            searchQuery ? undefined : <IconPlus className="h-4 w-4" stroke={2} />
          }
          onAction={
            searchQuery ? () => setSearchQuery('') : openCreateModal
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => {
            const visual = renderCategoryIcon(category);
            const isIncome = category.type === 'income';

            return (
              <Card
                key={category.id || category.value}
                className="flex items-center justify-between gap-3 transition-colors hover:border-ink-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${visual.badgeClass}`}
                  >
                    {visual.icon}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-primary">
                      {category.label}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant={isIncome ? 'income' : 'expense'}>
                        {isIncome ? 'Income' : 'Expense'}
                      </Badge>

                      {category.isDefault ? (
                        <Badge
                          variant="neutral"
                          icon={<IconLock className="h-2.5 w-2.5" stroke={2} />}
                        >
                          Default
                        </Badge>
                      ) : (
                        <Badge variant="brand">Custom</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Edit (always allowed) & Delete (custom categories only) */}
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${category.label}`}
                    onClick={() => openEditModal(category)}
                  >
                    <IconEdit className="h-4 w-4" stroke={1.75} />
                  </Button>

                  {!category.isDefault && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${category.label}`}
                      onClick={() => setDeletingCategory(category)}
                      className="text-expense hover:bg-expense/10 hover:text-expense"
                    >
                      <IconTrash className="h-4 w-4" stroke={1.75} />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        description="Customize the category name, flow type, icon, and accent badge."
        size="md"
      >
        <form onSubmit={handleSaveCategory} noValidate className="space-y-5">
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-expense/30 bg-expense/10 p-3 text-xs text-expense"
            >
              <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0" stroke={2} />
              <span>{formError}</span>
            </div>
          )}

          {/* Live Preview Banner */}
          <div className="flex items-center justify-between rounded-xl border border-subtle bg-surface-elevated/50 p-3.5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${previewVisual.badgeClass}`}
              >
                {previewVisual.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-primary">
                  {formLabel.trim() || 'Category Preview'}
                </p>
                <p className="text-xs text-ink-muted">
                  Live badge appearance
                </p>
              </div>
            </div>

            <Badge variant={formType === 'income' ? 'income' : 'expense'}>
              {formType === 'income' ? 'Income' : 'Expense'}
            </Badge>
          </div>

          {/* Type Switcher (Locked when editing a system default category) */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-secondary">
              Category Type
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-subtle bg-surface-elevated/60 p-1">
              <button
                type="button"
                disabled={isMutating || Boolean(editingCategory?.isDefault)}
                onClick={() => setFormType('expense')}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  formType === 'expense'
                    ? 'bg-expense text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <IconArrowDownRight className="h-4 w-4" stroke={2} />
                Expense
              </button>

              <button
                type="button"
                disabled={isMutating || Boolean(editingCategory?.isDefault)}
                onClick={() => setFormType('income')}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  formType === 'income'
                    ? 'bg-income text-canvas shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <IconArrowUpRight className="h-4 w-4" stroke={2} />
                Income
              </button>
            </div>
          </div>

          {/* Category Name */}
          <Input
            label="Category Name"
            name="categoryLabel"
            type="text"
            placeholder="e.g., Subscriptions, Gym & Fitness, Dividends"
            value={formLabel}
            onChange={(e) => {
              setFormLabel(e.target.value);
              if (formError) setFormError(null);
            }}
            disabled={isMutating}
          />

          {/* Color Token Picker */}
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-secondary">
              Badge Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_CHOICES.map((choice) => {
                const isSelected = formColor === choice.token;
                return (
                  <button
                    key={choice.token}
                    type="button"
                    disabled={isMutating}
                    onClick={() => setFormColor(choice.token)}
                    aria-label={`Select ${choice.label} color`}
                    className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-brand bg-brand/10 text-ink-primary'
                        : 'border-subtle bg-surface-elevated/40 text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${choice.swatchClass}`}
                    >
                      {isSelected && (
                        <IconCheck className="h-3 w-3 text-white" stroke={2.5} />
                      )}
                    </span>
                    <span>{choice.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Picker Grid */}
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-secondary">
              Category Icon
            </label>
            <div className="grid grid-cols-7 gap-2">
              {ICON_CHOICES.map((choice) => {
                const isSelected = formIcon === choice.name;
                const { icon } = renderCategoryIcon({
                  label: choice.label,
                  type: formType,
                  color: formColor,
                  iconName: choice.name,
                });

                return (
                  <button
                    key={choice.name}
                    type="button"
                    disabled={isMutating}
                    onClick={() => setFormIcon(choice.name)}
                    title={choice.label}
                    aria-label={`Select ${choice.label} icon`}
                    className={`flex h-10 w-full items-center justify-center rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-brand bg-brand/15 text-brand'
                        : 'border-subtle bg-surface-elevated/40 text-ink-secondary hover:border-ink-muted/50 hover:text-ink-primary'
                    }`}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex flex-col-reverse gap-2.5 border-t border-subtle pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isMutating}
            >
              Cancel
            </Button>

            <Button type="submit" isLoading={isMutating}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingCategory)}
        onClose={() => {
          if (!isMutating) setDeletingCategory(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Custom Category"
        message={
          deletingCategory
            ? `Are you sure you want to delete the "${deletingCategory.label}" category? Existing transactions under this category will keep their historical label.`
            : 'Are you sure you want to delete this category?'
        }
        // confirmLabel="Delete Category"
        variant="danger"
        isLoading={isMutating}
      />
    </div>
  );
}