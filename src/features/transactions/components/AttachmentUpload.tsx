import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import {
  IconPaperclip,
  IconUpload,
  IconFileTypePdf,
  IconPhoto,
  IconTrash,
  IconAlertCircle,
  IconExternalLink,
} from '@tabler/icons-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatFileSize } from '../../../utils';

export interface ExistingAttachment {
  name: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface AttachmentUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  existingAttachment?: ExistingAttachment | null;
  onRemoveExisting?: () => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  error?: string | null;
}

export const DEFAULT_ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const DEFAULT_MAX_ATTACHMENT_MB = 5;


export function AttachmentUpload({
  file,
  onChange,
  existingAttachment = null,
  onRemoveExisting,
  maxSizeMB = DEFAULT_MAX_ATTACHMENT_MB,
  acceptedTypes = DEFAULT_ACCEPTED_MIME_TYPES,
  disabled = false,
  error = null,
}: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create & safely revoke object URL when an image file is selected
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const validateAndSelectFile = (candidate: File | undefined) => {
    if (!candidate || disabled) return;

    setValidationError(null);

    if (!acceptedTypes.includes(candidate.type)) {
      setValidationError(
        'Unsupported file type. Please upload a JPG, PNG, WebP image, or PDF document.'
      );
      return;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (candidate.size > maxBytes) {
      setValidationError(
        `File is too large (${formatFileSize(
          candidate.size
        )}). Maximum allowed size is ${maxSizeMB} MB.`
      );
      return;
    }

    onChange(candidate);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    validateAndSelectFile(selected);
    // Reset input value so re-selecting the same file after removal still triggers onChange
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const dropped = e.dataTransfer.files?.[0];
    validateAndSelectFile(dropped);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleRemoveFile = () => {
    if (disabled) return;
    setValidationError(null);
    onChange(null);
  };

  const activeError = error || validationError;
  const isPdf = file?.type === 'application/pdf';

  return (
    <div className="space-y-2">
      {/* Label Header */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
          <IconPaperclip className="h-3.5 w-3.5 text-ink-muted" stroke={1.75} />
          Receipt / Invoice Attachment (Optional)
        </label>
        <span className="text-[11px] text-ink-muted">
          JPG, PNG, WebP, PDF • Max {maxSizeMB}MB
        </span>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        disabled={disabled}
        aria-label="Upload receipt or invoice attachment"
        className="hidden"
      />

      {/* State 1: New Local File Selected */}
      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-elevated/50 p-3">
          <div className="flex min-w-0 items-center gap-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={file.name}
                className="h-12 w-12 shrink-0 rounded-lg border border-subtle object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                {isPdf ? (
                  <IconFileTypePdf className="h-6 w-6" stroke={1.75} />
                ) : (
                  <IconPhoto className="h-6 w-6" stroke={1.75} />
                )}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-primary">
                {file.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="brand">Ready to upload</Badge>
                <span className="text-xs text-ink-muted">
                  {formatFileSize(file.size)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove attachment"
              onClick={handleRemoveFile}
              disabled={disabled}
              className="text-expense hover:bg-expense/10 hover:text-expense"
            >
              <IconTrash className="h-4 w-4" stroke={1.75} />
            </Button>
          </div>
        </div>
      ) : existingAttachment ? (
        /* State 2: Existing Saved Server Attachment (Edit Mode) */
        <div className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-elevated/50 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-income/15 text-income">
              {existingAttachment.mimeType === 'application/pdf' ? (
                <IconFileTypePdf className="h-5 w-5" stroke={1.75} />
              ) : (
                <IconPhoto className="h-5 w-5" stroke={1.75} />
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-primary">
                {existingAttachment.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="income">Attached</Badge>
                {typeof existingAttachment.sizeBytes === 'number' && (
                  <span className="text-xs text-ink-muted">
                    {formatFileSize(existingAttachment.sizeBytes)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={existingAttachment.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open saved attachment"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-ink-primary"
            >
              <IconExternalLink className="h-4 w-4" stroke={1.75} />
            </a>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Replace
            </Button>

            {onRemoveExisting && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove existing attachment"
                onClick={onRemoveExisting}
                disabled={disabled}
                className="text-expense hover:bg-expense/10 hover:text-expense"
              >
                <IconTrash className="h-4 w-4" stroke={1.75} />
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* State 3: Drag-and-Drop / Click Upload Zone */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
            disabled
              ? 'cursor-not-allowed border-subtle bg-surface-elevated/20 opacity-50'
              : isDragging
              ? 'border-brand bg-brand/10'
              : activeError
              ? 'border-expense/50 bg-expense/5 hover:border-expense'
              : 'border-subtle bg-surface-elevated/30 hover:border-brand/50 hover:bg-surface-elevated/60'
          }`}
        >
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated text-brand">
            <IconUpload className="h-4 w-4" stroke={1.75} />
          </div>
          <p className="text-xs font-medium text-ink-primary">
            <span className="text-brand">Click to upload</span> or drag and drop
            your receipt
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Supports JPG, PNG, WebP, or PDF up to {maxSizeMB} MB
          </p>
        </div>
      )}

      {/* Inline Validation / Server Error */}
      {activeError && (
        <div
          role="alert"
          className="flex items-start gap-1.5 text-xs text-expense"
        >
          <IconAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" stroke={2} />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
}