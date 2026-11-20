import { type InputHTMLAttributes, type ReactNode, useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export const Input = ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    id,
    className = "",
    disabled,
    ...props
}: InputProps) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
        <div className="w-full">
            {/* Label */}
            {label && (
                <label
                    htmlFor={inputId}
                    className="mb-1.5 block text-sm font-medium text-ink-primary"
                >
                    {label}
                </label>
            )}

            {/* Input Wrapper */}
            <div className="relative flex items-center">
                {leftIcon && (
                    <span className="pointer-events-none absolute left-3.5 inline-flex items-center text-ink-muted">
                        {leftIcon}
                    </span>
                )}

                <input
                    id={inputId}
                    disabled={disabled}
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                        error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
                    }
                    className={`h-10 w-full rounded-lg border bg-surface-elevated text-sm text-ink-primary placeholder:text-ink-muted transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50 ${
                        leftIcon ? "pl-10" : "pl-3.5"
                    } ${rightIcon ? "pr-10" : "pr-3.5"} ${
                        error
                            ? "border-expense focus:border-expense focus:ring-expense/40"
                            : "border-subtle hover:border-ink-muted/50 focus:border-brand focus:ring-brand/40"
                    } ${className}`}
                    {...props}
                />

                {rightIcon && (
                    <span className="absolute right-3.5 inline-flex items-center text-ink-muted">
                        {rightIcon}
                    </span>
                )}
            </div>

            {/* Validation Error or Helper Text */}
            {error ? (
                <p
                    id={`${inputId}-error`}
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-expense"
                >
                    {error}
                </p>
            ) : (
                helperText && (
                    <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-ink-muted">
                        {helperText}
                    </p>
                )
            )}
        </div>
    );
};
