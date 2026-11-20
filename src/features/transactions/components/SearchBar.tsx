import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  enableShortcut?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search transactions by title, note, or category...',
  debounceMs = 250,
  disabled = false,
  enableShortcut = true,
  ariaLabel = 'Search transactions',
  className = '',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localValue, setLocalValue] = useState<string>(value);

  // Sync local input when external value changes (e.g. Reset Filters)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce propagation to parent filter/API handler
  useEffect(() => {
    if (localValue === value) return;

    const timer = window.setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [localValue, value, debounceMs, onChange]);

  // Optional "/" keyboard shortcut when focus is not inside another input/textarea/select
  useEffect(() => {
    if (!enableShortcut || disabled) return;

    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isEditable =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable;

      if (!isEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [enableShortcut, disabled]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleClear = () => {
    if (disabled) return;
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && localValue) {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Left Search Icon */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted"
      >
        <IconSearch className="h-4 w-4" stroke={1.75} />
      </span>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-10 w-full rounded-xl border border-subtle bg-surface pr-10 pl-10 text-sm text-ink-primary placeholder:text-ink-muted transition-colors focus:border-brand focus:ring-2 focus:ring-brand/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />

      {/* Right Clear Button or "/" Shortcut Hint */}
      {localValue ? (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-elevated hover:text-ink-primary disabled:pointer-events-none"
        >
          <IconX className="h-3.5 w-3.5" stroke={2} />
        </button>
      ) : (
        enableShortcut && (
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-subtle bg-surface-elevated px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted sm:inline-block"
          >
            /
          </kbd>
        )
      )}
    </div>
  );
}