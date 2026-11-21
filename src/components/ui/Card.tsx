import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    hoverable?: boolean;
}

export const Card = ({ children, hoverable = false, className = "", ...props }: CardProps) => {
    return (
        <div
            className={`rounded-2xl border border-subtle bg-surface p-5 shadow-lg shadow-black/20 ${
                hoverable
                    ? "transition-colors duration-200 hover:border-ink-muted/40 hover:bg-surface-elevated/60"
                    : ""
            } ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export function CardHeader({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`mb-4 flex items-start justify-between gap-4 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({
    children,
    className = "",
    ...props
}: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={`text-base font-semibold tracking-tight text-ink-primary ${className}`}
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardDescription({
    children,
    className = "",
    ...props
}: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={`mt-1 text-xs text-ink-secondary ${className}`} {...props}>
            {children}
        </p>
    );
}

export function CardContent({
    children,
    className = "",
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={className} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`mt-4 flex items-center justify-between border-t border-subtle pt-4 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
