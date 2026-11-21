import { useEffect } from 'react';
import { IconX, IconPigMoney } from '@tabler/icons-react';
import { BudgetForm } from './BudgetForm';
import type { BudgetItem, BudgetPayload } from '../types/budget.types';

export interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBudget?: BudgetItem | null;
  existingBudgets?: BudgetItem[];
  defaultMonth?: string;
  onSubmit: (payload: BudgetPayload) => Promise<void> | void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

export function BudgetModal({
  isOpen,
  onClose,
  editingBudget = null,
  existingBudgets = [],
  defaultMonth,
  onSubmit,
  isSubmitting = false,
  serverError = null,
}: BudgetModalProps) {
  const isEditMode = Boolean(editingBudget?.id);

  // Close on Escape key when not actively submitting
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Dimmed Backdrop */}
      <div
        aria-hidden="true"
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-canvas/80 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Panel */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-subtle bg-surface p-5 shadow-2xl sm:p-6">
        {/* Modal Header */}
        <div className="mb-5 flex items-start justify-between gap-3 border-b border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <IconPigMoney className="h-5 w-5" stroke={1.75} />
            </div>

            <div>
              <h2
                id="budget-modal-title"
                className="text-lg font-bold tracking-tight text-ink-primary"
              >
                {isEditMode ? 'Edit Category Budget' : 'Create Category Budget'}
              </h2>
              <p className="mt-0.5 text-xs text-ink-secondary">
                {isEditMode
                  ? `Update spending limit and alert threshold for ${editingBudget?.category}.`
                  : 'Set a monthly spending target to track expenses and get early alerts.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close budget modal"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-ink-primary disabled:opacity-50"
          >
            <IconX className="h-5 w-5" stroke={1.75} />
          </button>
        </div>

        {/* Budget Form */}
        <BudgetForm
          initialValues={editingBudget}
          existingBudgets={existingBudgets}
          defaultMonth={defaultMonth}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          serverError={serverError}
        />
      </div>
    </div>
  );
}