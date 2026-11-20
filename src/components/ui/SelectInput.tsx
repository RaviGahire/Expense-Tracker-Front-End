import  { type SelectHTMLAttributes, type ReactNode, useId } from 'react';
import { IconChevronDown } from '@tabler/icons-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options?: SelectOption[];
  leftIcon?: ReactNode;
}

export const SelectInput =({
  label,
  error,
  helperText,
  placeholder,
  options,
  leftIcon,
  id,
  className = '',
  disabled,
  children,
  ...props
}: SelectProps) =>{
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-ink-primary"
        >
          {label}
        </label>
      )}

      {/* Select Wrapper */}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 inline-flex items-center text-ink-muted">
            {leftIcon}
          </span>
        )}

        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${selectId}-error`
              : helperText
              ? `${selectId}-helper`
              : undefined
          }
          className={`h-10 w-full appearance-none rounded-lg border bg-surface-elevated text-sm text-ink-primary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50 ${
            leftIcon ? 'pl-10' : 'pl-3.5'
          } pr-10 ${
            error
              ? 'border-expense focus:border-expense focus:ring-expense/40'
              : 'border-subtle hover:border-ink-muted/50 focus:border-brand focus:ring-brand/40'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="bg-surface text-ink-primary"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {/* Custom Dropdown Chevron */}
        <span className="pointer-events-none absolute right-3 inline-flex items-center text-ink-muted">
          <IconChevronDown className="h-4 w-4" stroke={2} />
        </span>
      </div>

      {/* Validation Error or Helper Text */}
      {error ? (
        <p
          id={`${selectId}-error`}
          role="alert"
          className="mt-1.5 text-xs font-medium text-expense"
        >
          {error}
        </p>
      ) : (
        helperText && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-xs text-ink-muted">
            {helperText}
          </p>
        )
      )}
    </div>
  );
}