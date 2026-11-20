import { Component, type ErrorInfo, type ReactNode } from "react";
import { IconBug, IconRefresh } from "@tabler/icons-react";
import { Button } from "../ui/Button";

export interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            errorMessage: "",
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            errorMessage: error.message || "An unexpected application error occurred.",
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught UI Error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, errorMessage: "" });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[60vh] items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-2xl border border-subtle bg-surface p-8 text-center shadow-2xl">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-expense/15 text-expense">
                            <IconBug className="h-6 w-6" stroke={1.75} />
                        </div>

                        <h2 className="text-lg font-semibold text-ink-primary">
                            Application Error
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                            {this.state.errorMessage}
                        </p>

                        <div className="mt-6 flex items-center justify-center gap-3">
                            <Button
                                variant="outline"
                                onClick={this.handleReset}
                                leftIcon={<IconRefresh className="h-4 w-4" stroke={1.75} />}
                            >
                                Reset View
                            </Button>
                            <Button onClick={() => window.location.reload()}>Reload Page</Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
