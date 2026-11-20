import { IconLoader2 } from "@tabler/icons-react";

export type LoaderSize = "sm" | "md" | "lg";

export interface LoaderProps {
    size?: LoaderSize;
    label?: string;
    fullScreen?: boolean;
    className?: string;
}

const iconSizes: Record<LoaderSize, string> = {
    sm: "h-4 w-4",
    md: "h-7 w-7",
    lg: "h-10 w-10",
};

export const Loader = ({ size = "md", label, fullScreen = false, className = "" }: LoaderProps) => {
    const content = (
        <div
            role="status"
            aria-live="polite"
            className={`flex flex-col items-center justify-center gap-3 ${className}`}
        >
            <IconLoader2 className={`animate-spin text-brand ${iconSizes[size]}`} stroke={2} />
            {label && <p className="text-sm font-medium text-ink-secondary">{label}</p>}
            <span className="sr-only">{label || "Loading..."}</span>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/85 backdrop-blur-xs">
                {content}
            </div>
        );
    }

    return content;
};
