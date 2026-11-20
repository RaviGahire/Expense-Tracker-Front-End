import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant =
  | 'income'
  | 'expense'
  | 'warning'
  | 'brand'
  | 'info'
  | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  income: 'bg-income/15 text-income border-income/25',
  expense: 'bg-expense/15 text-expense border-expense/25',
  warning: 'bg-warning/15 text-warning border-warning/25',
  brand: 'bg-brand/15 text-brand border-brand/25',
  info: 'bg-accent/15 text-accent border-accent/25',
  neutral: 'bg-surface-elevated text-ink-secondary border-subtle',
};

const dotColors: Record<BadgeVariant, string> = {
  income: 'bg-income',
  expense: 'bg-expense',
  warning: 'bg-warning',
  brand: 'bg-brand',
  info: 'bg-accent',
  neutral: 'bg-ink-muted',
};

export const Badge =({
  variant = 'neutral',
  dot = false,
  icon,
  className = '',
  children,
  ...props
}: BadgeProps)=> {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`}
        />
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
}