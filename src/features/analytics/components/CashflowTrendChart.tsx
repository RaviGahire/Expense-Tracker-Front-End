import { useState, useMemo } from "react";
import { IconChartBar } from "@tabler/icons-react";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import type { MonthlyCashflowPoint } from "../types/analytics.types";

export interface CashflowTrendChartProps {
    data: MonthlyCashflowPoint[];
    currency?: string;
}

function formatFullCurrency(amount: number, currency: string = "INR"): string {
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Math.abs(amount));
}

function formatCompactAxis(amount: number, currency: string = "INR"): string {
    if (amount === 0) return currency === "INR" ? "₹0" : "$0";
    const symbol =
        currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
    if (amount >= 100_000 && currency === "INR") {
        return `${symbol}${(amount / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
    }
    if (amount >= 1_000) {
        return `${symbol}${(amount / 1_000).toFixed(0)}k`;
    }
    return `${symbol}${Math.round(amount)}`;
}

export function CashflowTrendChart({ data, currency = "INR" }: CashflowTrendChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const { maxBarValue, axisTicks } = useMemo(() => {
        let peak = 0;
        for (const point of data) {
            if (point.income > peak) peak = point.income;
            if (point.expense > peak) peak = point.expense;
        }

        const safePeak = peak > 0 ? peak : 1000;
        const ceiling = Math.ceil((safePeak * 1.12) / 100) * 100;

        return {
            maxBarValue: ceiling,
            axisTicks: [ceiling, Math.round(ceiling * 0.66), Math.round(ceiling * 0.33), 0],
        };
    }, [data]);

    const activePoint =
        hoveredIndex !== null && data[hoveredIndex]
            ? data[hoveredIndex]
            : data.length > 0
              ? data[data.length - 1]
              : null;

    const hasAnyActivity = data.some((point) => point.income > 0 || point.expense > 0);

    return (
        <Card className="flex flex-col justify-between gap-5">
            {/* Header & Legend */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                        <IconChartBar className="h-5 w-5" stroke={1.75} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-ink-primary">
                            Income vs. Expense Trend
                        </h2>
                        <p className="text-xs text-ink-secondary">
                            Monthly cash-flow comparison across the selected period
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-ink-secondary">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-xs bg-income" />
                        Income
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-xs bg-expense" />
                        Expense
                    </span>
                </div>
            </div>

            {/* Interactive Month Spotlight Strip */}
            {activePoint && hasAnyActivity && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-elevated/50 px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-primary">{activePoint.label}</span>
                        <Badge
                            variant={
                                activePoint.net > 0
                                    ? "income"
                                    : activePoint.net < 0
                                      ? "expense"
                                      : "neutral"
                            }
                        >
                            {activePoint.net >= 0 ? "+" : "-"}
                            {formatFullCurrency(activePoint.net, currency)} net
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-ink-secondary">
                            In:{" "}
                            <strong className="font-semibold text-income">
                                {formatFullCurrency(activePoint.income, currency)}
                            </strong>
                        </span>
                        <span className="text-ink-secondary">
                            Out:{" "}
                            <strong className="font-semibold text-expense">
                                {formatFullCurrency(activePoint.expense, currency)}
                            </strong>
                        </span>
                        {activePoint.income > 0 && (
                            <span className="text-ink-muted">
                                Saved:{" "}
                                <strong className="text-ink-primary">
                                    {activePoint.savingsRate}%
                                </strong>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Chart Area */}
            {!hasAnyActivity ? (
                <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-surface-elevated/25 px-4 text-center">
                    <p className="text-sm font-semibold text-ink-primary">
                        No cash-flow activity in this window
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-ink-muted">
                        Select a wider timeframe or record income and expense transactions to
                        visualize monthly trends.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto pb-1">
                    <div className="min-w-105">
                        <div className="relative flex h-56 gap-3 pt-2">
                            {/* Left Y-Axis Scale */}
                            <div className="flex w-12 shrink-0 flex-col justify-between pb-6 text-right text-[11px] font-medium text-ink-muted">
                                {axisTicks.map((tick, idx) => (
                                    <span key={idx}>{formatCompactAxis(tick, currency)}</span>
                                ))}
                            </div>

                            {/* Plot Grid & Grouped Columns */}
                            <div className="relative flex-1">
                                {/* Horizontal Dashed Gridlines */}
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between"
                                >
                                    {axisTicks.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="w-full border-b border-dashed border-subtle/70"
                                        />
                                    ))}
                                </div>

                                {/* Month Bar Groups */}
                                <div className="relative z-10 flex h-full items-end justify-around gap-2 px-1">
                                    {data.map((point, index) => {
                                        const incomeHeightPct = Math.min(
                                            100,
                                            Math.round((point.income / maxBarValue) * 100)
                                        );
                                        const expenseHeightPct = Math.min(
                                            100,
                                            Math.round((point.expense / maxBarValue) * 100)
                                        );

                                        const isSelected =
                                            hoveredIndex === index ||
                                            (hoveredIndex === null && index === data.length - 1);

                                        return (
                                            <button
                                                key={point.monthKey}
                                                type="button"
                                                onMouseEnter={() => setHoveredIndex(index)}
                                                onFocus={() => setHoveredIndex(index)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                                aria-label={`${point.label}: Income ${formatFullCurrency(
                                                    point.income,
                                                    currency
                                                )}, Expense ${formatFullCurrency(
                                                    point.expense,
                                                    currency
                                                )}`}
                                                className={`group flex h-full flex-1 flex-col items-center justify-end rounded-lg px-1 pt-2 transition-colors focus:outline-none ${
                                                    isSelected
                                                        ? "bg-surface-elevated/55"
                                                        : "hover:bg-surface-elevated/35"
                                                }`}
                                            >
                                                {/* Bar Pair Container */}
                                                <div className="flex h-[calc(100%-1.5rem)] w-full max-w-11 items-end justify-center gap-1.5">
                                                    <div
                                                        style={{
                                                            height: `${
                                                                point.income > 0
                                                                    ? Math.max(4, incomeHeightPct)
                                                                    : 0
                                                            }%`,
                                                        }}
                                                        className="w-1/2 rounded-t-md bg-income transition-all duration-300 group-hover:brightness-110"
                                                    />
                                                    <div
                                                        style={{
                                                            height: `${
                                                                point.expense > 0
                                                                    ? Math.max(4, expenseHeightPct)
                                                                    : 0
                                                            }%`,
                                                        }}
                                                        className="w-1/2 rounded-t-md bg-expense transition-all duration-300 group-hover:brightness-110"
                                                    />
                                                </div>

                                                {/* X-Axis Month Label */}
                                                <span
                                                    className={`mt-1.5 flex h-4 items-center text-[11px] font-medium ${
                                                        isSelected
                                                            ? "font-bold text-brand"
                                                            : "text-ink-muted"
                                                    }`}
                                                >
                                                    {data.length > 8
                                                        ? point.shortLabel
                                                        : point.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
