import { useEffect, type ReactNode } from 'react';
import { IconX } from '@tabler/icons-react';
import { Button } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
}: ModalProps) =>{
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
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-canvas/80 backdrop-blur-xs transition-opacity"
      />

      {/* Dialog Panel */}
      <div
        className={`relative z-10 w-full ${sizeStyles[size]} rounded-2xl border border-subtle bg-surface p-6 shadow-2xl shadow-black/50`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-ink-primary"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-ink-secondary">{description}</p>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Close modal"
              onClick={onClose}
              className="-mr-1.5 -mt-1.5 shrink-0"
            >
              <IconX className="h-5 w-5" stroke={2} />
            </Button>
          </div>
        )}

        {/* Body */}
        <div>{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-subtle pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}