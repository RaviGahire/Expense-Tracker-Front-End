import { useState, useMemo } from "react";
import {
    IconPlus,
    IconPigMoney,
    IconWallet,
    IconReceipt,
    IconAlertTriangle,
    IconCopy,
    IconCalendar,
    IconChevronLeft,
    IconChevronRight,
} from "@tabler/icons-react";
import { useAuth } from "../../auth";
import { useTransactions } from "../../transactions/hooks/useTransactions";
import { useBudgets } from "../hooks/useBudgets";
import { BudgetProgressCard } from "../components/BudgetProgressCard";
import { BudgetModal } from "../components/BudgetModal";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import type {
    BudgetItem,
    BudgetPayload,
    BudgetStatus,
    BudgetWithProgress,
} from "../types/budget.types";

type BudgetStatusFilter = "all" | BudgetStatus;

function shiftMonthString(monthString: string, deltaMonths: number): string {
    const [yearStr, monthStr] = monthString.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (Number.isNaN(year) || Number.isNaN(month)) {
        return monthString;
    }

    const shifted = new Date(year, month - 1 + deltaMonths, 1);
    const nextYear = shifted.getFullYear();
    const nextMonth = String(shifted.getMonth() + 1).padStart(2, "0");
    return `${nextYear}-${nextMonth}`;
}

function formatDisplayMonth(monthString: string): string {
    const [yearStr, monthStr] = monthString.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (Number.isNaN(year) || Number.isNaN(month)) return monthString;

    return new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
    }).format(new Date(year, month - 1, 1));
}

function formatSummaryCurrency(amount: number, currency: string = "INR"): string {
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Math.abs(amount));
}

export function BudgetsPage() {
    const { user } = useAuth();
    const currency = user?.currency ?? "INR";

    const { transactions } = useTransactions();
    const {
        selectedMonth,
        setSelectedMonth,
        budgets,
        budgetsWithProgress,
        summary,
        isLoading,
        isMutating,
        error,
        refetch,
        createBudget,
        updateBudget,
        deleteBudget,
        copyFromPreviousMonth,
    } = useBudgets({ transactions });

    const [statusFilter, setStatusFilter] = useState<BudgetStatusFilter>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [deletingBudget, setDeletingBudget] = useState<BudgetWithProgress | null>(null);
    const [copyBannerMessage, setCopyBannerMessage] = useState<string | null>(null);

    const filteredBudgets = useMemo(() => {
        if (statusFilter === "all") return budgetsWithProgress;
        return budgetsWithProgress.filter((item) => item.status === statusFilter);
    }, [budgetsWithProgress, statusFilter]);

    const handleOpenCreateModal = () => {
        setEditingBudget(null);
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (budget: BudgetWithProgress) => {
        setEditingBudget(budget);
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isMutating) return;
        setIsModalOpen(false);
        setEditingBudget(null);
        setModalError(null);
    };

    const handleSaveBudget = async (payload: BudgetPayload) => {
        try {
            setModalError(null);
            if (editingBudget?.id) {
                await updateBudget(editingBudget.id, payload);
            } else {
                await createBudget(payload);
            }
            setIsModalOpen(false);
            setEditingBudget(null);
        } catch (err) {
            setModalError(
                err instanceof Error ? err.message : "Failed to save budget. Please try again."
            );
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingBudget) return;
        try {
            await deleteBudget(deletingBudget.id);
            setDeletingBudget(null);
        } catch {
            // Keep dialog open if deletion fails
        }
    };

    const handleCopyPrevious = async () => {
        try {
            setCopyBannerMessage(null);
            const copied = await copyFromPreviousMonth();
            if (copied.length === 0) {
                setCopyBannerMessage(
                    "No new budgets were copied (either last month had none or all categories already exist)."
                );
            } else {
                setCopyBannerMessage(
                    `Copied ${copied.length} ${
                        copied.length === 1 ? "budget" : "budgets"
                    } from ${formatDisplayMonth(shiftMonthString(selectedMonth, -1))}.`
                );
            }
        } catch (err) {
            setCopyBannerMessage(
                err instanceof Error ? err.message : "Unable to copy budgets from previous month."
            );
        }
    };

    const isOverallOverspent = summary.totalRemaining < 0;
    const clampedOverallPct = Math.min(100, Math.max(0, summary.overallPercentage));

    const filterTabs: {
        key: BudgetStatusFilter;
        label: string;
        count: number;
    }[] = [
        { key: "all", label: "All Budgets", count: summary.totalCount },
        { key: "exceeded", label: "Exceeded", count: summary.exceededCount },
        { key: "warning", label: "Near Limit", count: summary.warningCount },
        { key: "on-track", label: "On Track", count: summary.onTrackCount },
    ];

    return (
        <section className="space-y-6">
            {/* Top Page Header & Month Navigation Controls */}
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
                        Budgets
                    </h1>
                    <p className="mt-1 text-sm text-ink-secondary">
                        Set category spending caps for{" "}
                        <span className="font-semibold text-ink-primary">
                            {formatDisplayMonth(selectedMonth)}
                        </span>{" "}
                        and track live expense utilization.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Month Switcher Pill */}
                    <div className="flex items-center rounded-xl border border-subtle bg-surface p-1">
                        <button
                            type="button"
                            onClick={() => {
                                setCopyBannerMessage(null);
                                setSelectedMonth(shiftMonthString(selectedMonth, -1));
                            }}
                            aria-label="Previous month"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-ink-primary"
                        >
                            <IconChevronLeft className="h-4 w-4" stroke={2} />
                        </button>

                        <div className="flex items-center gap-1.5 px-2.5">
                            <IconCalendar className="h-4 w-4 text-brand" stroke={1.75} />
                            <input
                                type="month"
                                aria-label="Select budget month"
                                value={selectedMonth}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setCopyBannerMessage(null);
                                        setSelectedMonth(e.target.value);
                                    }
                                }}
                                className="bg-transparent text-xs font-semibold text-ink-primary focus:outline-none sm:text-sm"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setCopyBannerMessage(null);
                                setSelectedMonth(shiftMonthString(selectedMonth, 1));
                            }}
                            aria-label="Next month"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-ink-primary"
                        >
                            <IconChevronRight className="h-4 w-4" stroke={2} />
                        </button>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyPrevious}
                        disabled={isLoading || isMutating}
                        leftIcon={<IconCopy className="h-4 w-4" stroke={1.75} />}
                    >
                        Copy Last Month
                    </Button>

                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleOpenCreateModal}
                        disabled={isLoading || isMutating}
                        leftIcon={<IconPlus className="h-4 w-4" stroke={2} />}
                    >
                        New Budget
                    </Button>
                </div>
            </div>

            {/* Carry-Over Info Banner */}
            {copyBannerMessage && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-xs text-ink-primary">
                    <span>{copyBannerMessage}</span>
                    <button
                        type="button"
                        onClick={() => setCopyBannerMessage(null)}
                        className="font-semibold text-brand hover:underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Error State vs. Active Workspace */}
            {error ? (
                <ErrorState
                    title="Unable to load budgets"
                    message={error}
                    onRetry={refetch}
                    isRetrying={isLoading}
                />
            ) : (
                <>
                    {/* 4-Card Monthly Budget Summary Strip */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-ink-secondary">
                                    Total Budgeted
                                </p>
                                <p className="mt-1 text-2xl font-bold tracking-tight text-ink-primary">
                                    {formatSummaryCurrency(summary.totalBudgeted, currency)}
                                </p>
                                <p className="mt-0.5 text-[11px] text-ink-muted">
                                    Across {summary.totalCount}{" "}
                                    {summary.totalCount === 1 ? "category" : "categories"}
                                </p>
                            </div>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                                <IconPigMoney className="h-5 w-5" stroke={1.75} />
                            </div>
                        </Card>

                        <Card className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-ink-secondary">
                                    Total Spent
                                </p>
                                <p className="mt-1 text-2xl font-bold tracking-tight text-expense">
                                    {formatSummaryCurrency(summary.totalSpent, currency)}
                                </p>
                                <p className="mt-0.5 text-[11px] text-ink-muted">
                                    {summary.overallPercentage}% of total limit
                                </p>
                            </div>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-expense/15 text-expense">
                                <IconReceipt className="h-5 w-5" stroke={1.75} />
                            </div>
                        </Card>

                        <Card className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-ink-secondary">
                                    {isOverallOverspent ? "Over Budget" : "Remaining"}
                                </p>
                                <p
                                    className={`mt-1 text-2xl font-bold tracking-tight ${
                                        isOverallOverspent ? "text-expense" : "text-income"
                                    }`}
                                >
                                    {formatSummaryCurrency(summary.totalRemaining, currency)}
                                </p>
                                <p className="mt-0.5 text-[11px] text-ink-muted">
                                    {isOverallOverspent
                                        ? "Exceeds monthly cap"
                                        : "Available to spend"}
                                </p>
                            </div>
                            <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                    isOverallOverspent
                                        ? "bg-expense/15 text-expense"
                                        : "bg-income/15 text-income"
                                }`}
                            >
                                <IconWallet className="h-5 w-5" stroke={1.75} />
                            </div>
                        </Card>

                        <Card className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-ink-secondary">
                                    Alerts Active
                                </p>
                                <p className="mt-1 text-2xl font-bold tracking-tight text-warning">
                                    {summary.exceededCount + summary.warningCount}
                                </p>
                                <p className="mt-0.5 text-[11px] text-ink-muted">
                                    {summary.exceededCount} exceeded • {summary.warningCount} near
                                    limit
                                </p>
                            </div>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                                <IconAlertTriangle className="h-5 w-5" stroke={1.75} />
                            </div>
                        </Card>
                    </div>

                    {/* Overall Monthly Utilization Bar */}
                    {summary.totalCount > 0 && (
                        <Card className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-ink-primary">
                                        Overall Monthly Utilization
                                    </span>
                                    <Badge
                                        variant={
                                            summary.overallPercentage >= 100
                                                ? "expense"
                                                : summary.overallPercentage >= 80
                                                  ? "warning"
                                                  : "income"
                                        }
                                    >
                                        {summary.overallPercentage}% used
                                    </Badge>
                                </div>

                                <span className="text-xs text-ink-secondary">
                                    {formatSummaryCurrency(summary.totalSpent, currency)} spent of{" "}
                                    {formatSummaryCurrency(summary.totalBudgeted, currency)}
                                </span>
                            </div>

                            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-elevated">
                                <div
                                    style={{ width: `${clampedOverallPct}%` }}
                                    className={`h-full rounded-full transition-all duration-300 ${
                                        summary.overallPercentage >= 100
                                            ? "bg-expense"
                                            : summary.overallPercentage >= 80
                                              ? "bg-warning"
                                              : "bg-brand"
                                    }`}
                                />
                            </div>
                        </Card>
                    )}

                    {/* Status Filter Tabs */}
                    {budgetsWithProgress.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            {filterTabs.map((tab) => {
                                const isActive = statusFilter === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setStatusFilter(tab.key)}
                                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                                            isActive
                                                ? "border-brand bg-brand/15 text-brand"
                                                : "border-subtle bg-surface text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary"
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span
                                            className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                                                isActive
                                                    ? "bg-brand text-canvas"
                                                    : "bg-surface-elevated text-ink-muted"
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Budget Progress Cards Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <Card key={idx} className="animate-pulse space-y-4">
                                    {/* Top Row: Icon, Title/Subtitle & Action Button Placeholders */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-surface-elevated" />
                                            <div className="space-y-2">
                                                <div className="h-4 w-28 rounded bg-surface-elevated" />
                                                <div className="h-3 w-36 rounded bg-surface-elevated" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <div className="h-9 w-9 rounded-lg bg-surface-elevated" />
                                            <div className="h-9 w-9 rounded-lg bg-surface-elevated" />
                                        </div>
                                    </div>

                                    {/* Middle Row: Spent Figure, Status Pill & Progress Bar */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="h-6 w-36 rounded bg-surface-elevated" />
                                            <div className="h-5 w-24 rounded-full bg-surface-elevated" />
                                        </div>

                                        <div className="h-2.5 w-full rounded-full bg-surface-elevated" />

                                        {/* Bottom Caption Row */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="h-3 w-28 rounded bg-surface-elevated" />
                                            <div className="h-3 w-16 rounded bg-surface-elevated" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : budgetsWithProgress.length === 0 ? (
                        <EmptyState
                            icon={<IconPigMoney className="h-7 w-7" stroke={1.75} />}
                            title={`No budgets set for ${formatDisplayMonth(selectedMonth)}`}
                            description="Create a monthly spending limit for your expense categories or copy last month's targets in one click."
                            actionLabel="Create First Budget"
                            onAction={handleOpenCreateModal}
                        />
                    ) : filteredBudgets.length === 0 ? (
                        <EmptyState
                            icon={<IconPigMoney className="h-7 w-7" stroke={1.75} />}
                            title="No budgets match this filter"
                            description="Try switching back to All Budgets to view every category target for this month."
                            actionLabel="Show All Budgets"
                            onAction={() => setStatusFilter("all")}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredBudgets.map((budget) => (
                                <BudgetProgressCard
                                    key={budget.id}
                                    budget={budget}
                                    currency={currency}
                                    onEdit={handleOpenEditModal}
                                    onDelete={setDeletingBudget}
                                    disabled={isMutating}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Create / Edit Budget Modal */}
            <BudgetModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                editingBudget={editingBudget}
                existingBudgets={budgets}
                defaultMonth={selectedMonth}
                onSubmit={handleSaveBudget}
                isSubmitting={isMutating}
                serverError={modalError}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={Boolean(deletingBudget)}
                onClose={() => {
                    if (!isMutating) setDeletingBudget(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Budget"
                message={`Are you sure you want to delete the "${
                    deletingBudget?.category ?? ""
                }" budget for ${formatDisplayMonth(
                    selectedMonth
                )}? Your recorded transactions will not be affected.`}
                confirmText="Delete Budget"
                cancelText="Keep Budget"
                isLoading={isMutating}
            />
        </section>
    );
}
