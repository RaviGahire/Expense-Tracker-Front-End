import { useEffect, type ReactNode } from 'react';
import { IconX } from '@tabler/icons-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidthClass = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl border border-subtle bg-surface shadow-2xl`}
      >
        {/* Pinned Header (Never clips off top) */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-subtle px-5 py-4">
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="text-lg font-bold tracking-tight text-ink-primary"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-ink-primary"
          >
            <IconX className="h-5 w-5" stroke={1.75} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}