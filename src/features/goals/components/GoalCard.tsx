import { useMemo } from "react";
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconPlayerPause,
    IconPlayerPlay,
    IconCalendarEvent,
    IconCircleCheck,
    IconSparkles,
} from "@tabler/icons-react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { CategoryIcon, type CategoryColorToken } from "../../categories/components/CategoryIcon";
import type { GoalPriority, SavingsGoal } from "../types/goal.types";

export interface GoalCardProps {
    goal: SavingsGoal;
    currency?: string;
    isMutating?: boolean;
    onContribute: (goal: SavingsGoal) => void;
    onEdit: (goal: SavingsGoal) => void;
    onTogglePause: (goal: SavingsGoal) => void;
    onDelete: (goal: SavingsGoal) => void;
}

const PROGRESS_BAR_CLASS_MAP: Record<CategoryColorToken, string> = {
    brand: "bg-brand",
    income: "bg-income",
    expense: "bg-expense",
    warning: "bg-warning",
    neutral: "bg-brand",
    accent: "bg-brand",
};

const PRIORITY_BADGE_MAP: Record<
    GoalPriority,
    { label: string; variant: "expense" | "warning" | "neutral" }
> = {
    high: { label: "High Priority", variant: "expense" },
    medium: { label: "Medium", variant: "warning" },
    low: { label: "Low", variant: "neutral" },
};

function formatGoalCurrency(amount: number, currency: string = "INR"): string {
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Math.max(0, amount));
}

function parseLocalYmd(dateStr: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatShortGoalDate(dateStr: string): string {
    const parsed = parseLocalYmd(dateStr);
    if (!parsed) return dateStr;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(parsed);
}

export function GoalCard({
    goal,
    currency = "INR",
    isMutating = false,
    onContribute,
    onEdit,
    onTogglePause,
    onDelete,
}: GoalCardProps) {
    const isCompleted = goal.status === "completed";
    const isPaused = goal.status === "paused";

    const { percentage, remainingAmount, deadlineLabel, isOverdue, monthlyPaceRequired } =
        useMemo(() => {
            const rawPct =
                goal.targetAmount > 0
                    ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                    : 0;
            const clampedPct = Math.min(100, Math.max(0, rawPct));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            if (!goal.targetDate) {
                return {
                    percentage: clampedPct,
                    remainingAmount: remaining,
                    deadlineLabel: "No target deadline",
                    isOverdue: false,
                    monthlyPaceRequired: null,
                };
            }

            const parsedTarget = parseLocalYmd(goal.targetDate);
            if (!parsedTarget) {
                return {
                    percentage: clampedPct,
                    remainingAmount: remaining,
                    deadlineLabel: goal.targetDate,
                    isOverdue: false,
                    monthlyPaceRequired: null,
                };
            }

            const now = new Date();
            const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const diffMs = parsedTarget.getTime() - todayMidnight.getTime();
            const diffDays = Math.ceil(diffMs / 86_400_000);
            const overdue = !isCompleted && diffDays < 0;

            let label = formatShortGoalDate(goal.targetDate);
            if (!isCompleted) {
                if (diffDays < 0) {
                    label = `${Math.abs(diffDays)}d overdue (${label})`;
                } else if (diffDays === 0) {
                    label = "Due today";
                } else if (diffDays <= 45) {
                    label = `${diffDays}d left • ${label}`;
                } else {
                    const monthsLeft = Math.max(1, Math.round(diffDays / 30.4));
                    label = `~${monthsLeft} mo left • ${label}`;
                }
            }

            const monthsForPace = Math.max(1, diffDays / 30.4375);
            const pace =
                !isCompleted && remaining > 0 ? Math.ceil(remaining / monthsForPace) : null;

            return {
                percentage: clampedPct,
                remainingAmount: remaining,
                deadlineLabel: label,
                isOverdue: overdue,
                monthlyPaceRequired: pace,
            };
        }, [goal.currentAmount, goal.targetAmount, goal.targetDate, isCompleted]);

    const priorityMeta = PRIORITY_BADGE_MAP[goal.priority];
    const progressBarClass = isCompleted
        ? "bg-income"
        : (PROGRESS_BAR_CLASS_MAP[goal.color] ?? "bg-brand");

    return (
        <Card
            className={`flex flex-col justify-between gap-4 transition-all ${
                isPaused ? "opacity-80" : ""
            } ${isCompleted ? "border-income/35" : ""}`}
        >
            {/* Top Section: Icon, Title, Category & Status Badges */}
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <CategoryIcon
                            name={goal.iconName}
                            label={goal.title}
                            type="income"
                            color={isCompleted ? "income" : goal.color}
                            size="md"
                        />
                        <div className="min-w-0">
                            <h3 className="truncate text-base font-bold text-ink-primary">
                                {goal.title}
                            </h3>
                            <p className="truncate text-xs text-ink-secondary">{goal.category}</p>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {isCompleted ? (
                            <Badge variant="income">
                                <IconCircleCheck className="mr-1 inline h-3.5 w-3.5" stroke={2} />
                                Completed
                            </Badge>
                        ) : isPaused ? (
                            <Badge variant="neutral">Paused</Badge>
                        ) : (
                            <Badge variant={priorityMeta.variant}>{priorityMeta.label}</Badge>
                        )}
                    </div>
                </div>

                {/* Saved vs Target Amounts & Progress Bar */}
                <div className="rounded-xl border border-subtle/70 bg-surface-elevated/40 p-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                        <div>
                            <span className="text-lg font-bold tracking-tight text-ink-primary">
                                {formatGoalCurrency(goal.currentAmount, currency)}
                            </span>
                            <span className="ml-1.5 text-xs text-ink-muted">
                                of {formatGoalCurrency(goal.targetAmount, currency)}
                            </span>
                        </div>

                        <span
                            className={`text-xs font-bold ${
                                isCompleted ? "text-income" : "text-brand"
                            }`}
                        >
                            {percentage}%
                        </span>
                    </div>

                    {/* Progress Track */}
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
                        <div
                            style={{
                                width: `${percentage > 0 ? Math.max(4, percentage) : 0}%`,
                            }}
                            className={`h-full rounded-full transition-all duration-300 ${progressBarClass}`}
                        />
                    </div>

                    {/* Remaining & Monthly Pace Strip */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        {isCompleted ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-income">
                                <IconSparkles className="h-3.5 w-3.5" stroke={1.75} />
                                Target reached!
                            </span>
                        ) : (
                            <span className="text-ink-secondary">
                                Remaining:{" "}
                                <strong className="font-semibold text-ink-primary">
                                    {formatGoalCurrency(remainingAmount, currency)}
                                </strong>
                            </span>
                        )}

                        {monthlyPaceRequired !== null && !isPaused && (
                            <span className="text-ink-muted">
                                Pace:{" "}
                                <strong className="font-semibold text-ink-secondary">
                                    {formatGoalCurrency(monthlyPaceRequired, currency)}/mo
                                </strong>
                            </span>
                        )}
                    </div>
                </div>

                {/* Deadline & Optional Notes */}
                <div className="space-y-1.5 text-xs">
                    <div
                        className={`flex items-center gap-1.5 ${
                            isOverdue ? "font-semibold text-expense" : "text-ink-secondary"
                        }`}
                    >
                        <IconCalendarEvent className="h-3.5 w-3.5 shrink-0" stroke={1.75} />
                        <span className="truncate">{deadlineLabel}</span>
                    </div>

                    {goal.notes && (
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
                            {goal.notes}
                        </p>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-2 border-t border-subtle/70 pt-3">
                <Button
                    type="button"
                    variant={isCompleted ? "secondary" : "primary"}
                    size="sm"
                    disabled={isMutating}
                    onClick={() => onContribute(goal)}
                >
                    <IconPlus className="h-4 w-4" stroke={2} />
                    {isCompleted ? "Add Extra" : "Add Funds"}
                </Button>

                <div className="flex items-center gap-1">
                    {!isCompleted && (
                        <button
                            type="button"
                            onClick={() => onTogglePause(goal)}
                            disabled={isMutating}
                            title={isPaused ? "Resume goal" : "Pause goal"}
                            aria-label={isPaused ? "Resume goal" : "Pause goal"}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-ink-primary disabled:opacity-50"
                        >
                            {isPaused ? (
                                <IconPlayerPlay className="h-4.5 w-4.5" stroke={1.75} />
                            ) : (
                                <IconPlayerPause className="h-4.5 w-4.5" stroke={1.75} />
                            )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onEdit(goal)}
                        disabled={isMutating}
                        title="Edit goal"
                        aria-label="Edit goal"
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-ink-primary disabled:opacity-50"
                    >
                        <IconEdit className="h-4.5 w-4.5" stroke={1.75} />
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(goal)}
                        disabled={isMutating}
                        title="Delete goal"
                        aria-label="Delete goal"
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-secondary transition-colors hover:bg-expense/15 hover:text-expense disabled:opacity-50"
                    >
                        <IconTrash className="h-4.5 w-4.5" stroke={1.75} />
                    </button>
                </div>
            </div>
        </Card>
    );
}
