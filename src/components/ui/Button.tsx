import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { IconLoader2 } from '@tabler/icons-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-canvas font-semibold hover:bg-brand-hover shadow-md shadow-brand/10 focus-visible:ring-brand',
  secondary:
    'bg-surface-elevated text-ink-primary font-medium hover:bg-subtle focus-visible:ring-subtle',
  outline:
    'border border-subtle bg-transparent text-ink-primary font-medium hover:bg-surface-elevated focus-visible:ring-subtle',
  ghost:
    'bg-transparent text-ink-secondary font-medium hover:bg-surface-elevated hover:text-ink-primary focus-visible:ring-subtle',
  danger:
    'bg-expense/15 text-expense font-medium hover:bg-expense hover:text-white focus-visible:ring-expense',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-5 text-base rounded-xl gap-2.5',
  icon: 'h-10 w-10 p-0 rounded-lg justify-center',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <IconLoader2 className="h-4 w-4 animate-spin" stroke={2} />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}