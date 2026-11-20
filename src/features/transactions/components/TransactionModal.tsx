import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import {
  TransactionForm,
  type TransactionFormValues,
} from './TransactionForm';
import type { ExistingAttachment } from './AttachmentUpload';

export interface EditableTransaction extends Partial<TransactionFormValues> {
  id?: string;
  existingAttachment?: ExistingAttachment | null;
}

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TransactionFormValues) => Promise<void> | void;
  transaction?: EditableTransaction | null;
  isSubmitting?: boolean;
  serverError?: string | null;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  transaction = null,
  isSubmitting = false,
  serverError = null,
}: TransactionModalProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  // Clear local error state whenever the modal opens/closes or switches target record
  useEffect(() => {
    setLocalError(null);
  }, [isOpen, transaction]);

  const isEditMode = Boolean(transaction?.id || transaction?.title);

  const handleClose = () => {
    if (isSubmitting) return;
    setLocalError(null);
    onClose();
  };

  const handleFormSubmit = async (values: TransactionFormValues) => {
    try {
      setLocalError(null);
      await onSubmit(values);
      onClose();
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : 'Unable to save transaction. Please try again.'
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Transaction' : 'Add Transaction'}
      description={
        isEditMode
          ? 'Update the details, schedule, or receipt for this entry.'
          : 'Record a new expense or income with optional schedule and receipt.'
      }
      size="lg"
    >
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <TransactionForm
          initialValues={transaction ?? undefined}
          existingAttachment={transaction?.existingAttachment ?? null}
          onSubmit={handleFormSubmit}
          onCancel={handleClose}
          isSubmitting={isSubmitting}
          serverError={serverError || localError}
          submitLabel={isEditMode ? 'Save Changes' : undefined}
        />
      </div>
    </Modal>
  );
}