import { useEffect, type ReactNode } from "react";
import {
    IconCheck,
    IconAlertCircle,
    IconAlertTriangle,
    IconInfoCircle,
    IconX,
} from "@tabler/icons-react";
import { Button } from "../ui/Button";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastProps {
    id?: string;
    title: string;
    description?: string;
    variant?: ToastVariant;
    duration?: number;
    onClose: () => void;
}

const variantConfig: Record<
    ToastVariant,
    {
        border: string;
        iconBg: string;
        iconColor: string;
        icon: ReactNode;
    }
> = {
    success: {
        border: "border-income/30",
        iconBg: "bg-income/15",
        iconColor: "text-income",
        icon: <IconCheck className="h-4 w-4" stroke={2.25} />,
    },
    error: {
        border: "border-expense/30",
        iconBg: "bg-expense/15",
        iconColor: "text-expense",
        icon: <IconAlertCircle className="h-4 w-4" stroke={2} />,
    },
    warning: {
        border: "border-warning/30",
        iconBg: "bg-warning/15",
        iconColor: "text-warning",
        icon: <IconAlertTriangle className="h-4 w-4" stroke={2} />,
    },
    info: {
        border: "border-accent/30",
        iconBg: "bg-accent/15",
        iconColor: "text-accent",
        icon: <IconInfoCircle className="h-4 w-4" stroke={2} />,
    },
};

export function Toast({
    title,
    description,
    variant = "info",
    duration = 4000,
    onClose,
}: ToastProps) {
    useEffect(() => {
        if (duration <= 0) return;
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const config = variantConfig[variant];

    return (
        <div
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-4 shadow-2xl shadow-black/40 ${config.border}`}
        >
            <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor}`}
            >
                {config.icon}
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-primary">{title}</p>
                {description && (
                    <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{description}</p>
                )}
            </div>

            <Button
                variant="ghost"
                size="icon"
                aria-label="Dismiss notification"
                onClick={onClose}
                className="-mr-1.5 -mt-1.5 h-8 w-8 shrink-0"
            >
                <IconX className="h-4 w-4" stroke={2} />
            </Button>
        </div>
    );
}

export function ToastContainer({ children }: { children: ReactNode }) {
    return (
        <div
            aria-label="Notifications"
            className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
        >
            {children}
        </div>
    );
}
