import { useState } from 'react';
import {
  IconTag,
  IconArrowDownRight,
  IconArrowUpRight,
  IconSparkles,
  IconRefresh,
  IconRotateClockwise,
} from '@tabler/icons-react';
import { useCategoriesContext } from '../context/CategoriesContext';
import {
  CategoryManager,
  type CategoryPayload,
} from '../components/CategoryManager';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export function CategoriesPage() {
  const {
    categories,
    counts,
    isLoading,
    isMutating,
    error,
    refresh,
    createCategory,
    updateCategory,
    deleteCategory,
    resetCategories,
  } = useCategoriesContext();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateCategory = async (payload: CategoryPayload) => {
    await createCategory(payload);
  };

  const handleUpdateCategory = async (
    id: string,
    payload: CategoryPayload
  ) => {
    await updateCategory(id, payload);
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
  };

  const handleConfirmReset = async () => {
    await resetCategories();
    setIsResetDialogOpen(false);
  };

  return (
    <section className="space-y-6">
      {/* Top Page Header & Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
            Categories
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Organize your income and expense labels, customize badge colors,
            and manage custom categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {counts.custom > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetDialogOpen(true)}
              disabled={isLoading || isMutating}
              leftIcon={
                <IconRotateClockwise className="h-4 w-4" stroke={1.75} />
              }
            >
              Reset Defaults
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            isLoading={isRefreshing}
            leftIcon={<IconRefresh className="h-4 w-4" stroke={1.75} />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Error State vs. Active Workspace */}
      {error ? (
        <ErrorState
          title="Unable to load categories"
          message={error}
          onRetry={handleRefresh}
          isRetrying={isRefreshing}
        />
      ) : (
        <>
          {/* Category Overview Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-secondary">
                  Total Categories
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-ink-primary">
                  {counts.total}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <IconTag className="h-5 w-5" stroke={1.75} />
              </div>
            </Card>

            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-secondary">
                  Expense Categories
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-expense">
                  {counts.expense}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-expense/15 text-expense">
                <IconArrowDownRight className="h-5 w-5" stroke={1.75} />
              </div>
            </Card>

            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-secondary">
                  Income Categories
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-income">
                  {counts.income}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-income/15 text-income">
                <IconArrowUpRight className="h-5 w-5" stroke={1.75} />
              </div>
            </Card>

            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-secondary">
                  Custom Created
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-accent">
                  {counts.custom}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <IconSparkles className="h-5 w-5" stroke={1.75} />
              </div>
            </Card>
          </div>

          {/* Interactive Category Manager Grid & Modal */}
          <CategoryManager
            categories={categories}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            isLoading={isLoading}
            isMutating={isMutating}
          />
        </>
      )}

      {/* Confirm Reset to Default Categories Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => {
          if (!isMutating) setIsResetDialogOpen(false);
        }}
        onConfirm={handleConfirmReset}
        title="Reset Default Categories"
        message={`Are you sure you want to remove your ${counts.custom} custom ${
          counts.custom === 1 ? 'category' : 'categories'
        } and restore all built-in defaults? Existing transactions will retain their saved category names.`}
        // confirmLabel="Reset Categories"
        variant="danger"
        isLoading={isMutating}
      />
    </section>
  );
}