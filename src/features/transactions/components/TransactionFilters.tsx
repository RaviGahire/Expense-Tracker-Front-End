import { useMemo, type ChangeEvent } from "react";
import {
    
    IconFilter,
    IconTag,
    IconArrowsSort,
    IconCalendar,
    IconCreditCard,
    IconRotateClockwise,
    
} from "@tabler/icons-react";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { SelectInput } from "../../../components/ui/SelectInput";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHOD_OPTIONS } from "./TransactionForm";
import { SearchBar } from "./SearchBar";
import { type FilterTransactionType } from "../types/types";
import { type TransactionSortBy } from "../types/types";


export interface TransactionFilterState {
    search: string;
    type: FilterTransactionType;
    category: string;
    paymentMethod: string;
    sortBy: TransactionSortBy;
    dateFrom: string;
    dateTo: string;
}

export interface TransactionFiltersProps {
    filters: TransactionFilterState;
    onChange: (nextFilters: TransactionFilterState) => void;
    onReset: () => void;
    totalCount?: number;
    filteredCount?: number;
    disabled?: boolean;
}

export const INITIAL_TRANSACTION_FILTERS: TransactionFilterState = {
    search: "",
    type: "all",
    category: "all",
    paymentMethod: "all",
    sortBy: "date_desc",
    dateFrom: "",
    dateTo: "",
};

const TYPE_OPTIONS: { value: FilterTransactionType; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: "expense", label: "Expenses Only" },
    { value: "income", label: "Income Only" },
];

const SORT_OPTIONS: { value: TransactionSortBy; label: string }[] = [
    { value: "date_desc", label: "Newest First" },
    { value: "date_asc", label: "Oldest First" },
    { value: "amount_desc", label: "Highest Amount" },
    { value: "amount_asc", label: "Lowest Amount" },
];

export function countActiveFilters(filters: TransactionFilterState): number {
    let count = 0;
    if (filters.search.trim()) count += 1;
    if (filters.type !== "all") count += 1;
    if (filters.category !== "all") count += 1;
    if (filters.paymentMethod !== "all") count += 1;
    if (filters.dateFrom) count += 1;
    if (filters.dateTo) count += 1;
    return count;
}

export function TransactionFilters({
    filters,
    onChange,
    onReset,
    totalCount,
    filteredCount,
    disabled = false,
}: TransactionFiltersProps) {
    // Dynamically scope category dropdown based on selected Type ('all', 'expense', 'income')
    const categoryOptions = useMemo(() => {
        const base = [{ value: "all", label: "All Categories" }];

        if (filters.type === "expense") {
            return [...base, ...EXPENSE_CATEGORIES];
        }
        if (filters.type === "income") {
            return [...base, ...INCOME_CATEGORIES];
        }

        const mergedMap = new Map<string, string>();
        [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].forEach((item) => {
            mergedMap.set(item.value, item.label);
        });

        const uniqueCategories = Array.from(mergedMap.entries()).map(([value, label]) => ({
            value,
            label,
        }));

        return [...base, ...uniqueCategories];
    }, [filters.type]);

    const paymentOptions = useMemo(
        () => [{ value: "all", label: "All Payment Methods" }, ...PAYMENT_METHOD_OPTIONS],
        []
    );

    const activeFilterCount = countActiveFilters(filters);

    const handleFieldChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // If switching type invalidates the currently chosen category, reset category to 'all'
        if (name === "type") {
            const nextType = value as FilterTransactionType;
            const validSet =
                nextType === "expense"
                    ? EXPENSE_CATEGORIES
                    : nextType === "income"
                      ? INCOME_CATEGORIES
                      : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

            const keepsCategory =
                filters.category === "all" ||
                validSet.some((item) => item.value === filters.category);

            onChange({
                ...filters,
                type: nextType,
                category: keepsCategory ? filters.category : "all",
            });
            return;
        }

        onChange({
            ...filters,
            [name]: value,
        });
    };


    return (
        <Card className="space-y-4">
            {/* Top Row: Search Input + Type + Category + Sort */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                {/* Search Box */}
                <div className="sm:col-span-2 lg:col-span-4">
                    <SearchBar
                        value={filters.search}
                        onChange={(nextSearch) =>
                            onChange({
                                ...filters,
                                search: nextSearch,
                            })
                        }
                        disabled={disabled}
                    />
                </div>

                {/* Type Filter */}
                <div className="lg:col-span-2">
                    <SelectInput
                        aria-label="Filter by transaction type"
                        name="type"
                        value={filters.type}
                        onChange={handleFieldChange}
                        options={TYPE_OPTIONS}
                        disabled={disabled}
                        leftIcon={<IconFilter className="h-4 w-4" stroke={1.75} />}
                    />
                </div>

                {/* Category Filter */}
                <div className="lg:col-span-3">
                    <SelectInput
                        aria-label="Filter by category"
                        name="category"
                        value={filters.category}
                        onChange={handleFieldChange}
                        options={categoryOptions}
                        disabled={disabled}
                        leftIcon={<IconTag className="h-4 w-4" stroke={1.75} />}
                    />
                </div>

                {/* Sort Order */}
                <div className="lg:col-span-3">
                    <SelectInput
                        aria-label="Sort transactions"
                        name="sortBy"
                        value={filters.sortBy}
                        onChange={handleFieldChange}
                        options={SORT_OPTIONS}
                        disabled={disabled}
                        leftIcon={<IconArrowsSort className="h-4 w-4" stroke={1.75} />}
                    />
                </div>
            </div>

            {/* Bottom Row: Payment Method + Date Range + Active Filter Status & Reset */}
            <div className="grid grid-cols-1 items-end gap-3 border-t border-subtle pt-4 sm:grid-cols-2 lg:grid-cols-12">
                {/* Payment Method */}
                <div className="lg:col-span-3">
                    <SelectInput
                        label="Payment Method"
                        name="paymentMethod"
                        value={filters.paymentMethod}
                        onChange={handleFieldChange}
                        options={paymentOptions}
                        disabled={disabled}
                        leftIcon={<IconCreditCard className="h-4 w-4" stroke={1.75} />}
                    />
                </div>

                {/* Date From */}
                <div className="lg:col-span-3">
                    <Input
                        label="From Date"
                        name="dateFrom"
                        type="date"
                        max={filters.dateTo || undefined}
                        value={filters.dateFrom}
                        onChange={handleFieldChange}
                        disabled={disabled}
                        leftIcon={<IconCalendar className="h-4 w-4" stroke={1.75} />}
                    />
                </div>

                {/* Date To */}
                <div className="lg:col-span-3">
                    <Input
                        label="To Date"
                        name="dateTo"
                        type="date"
                        min={filters.dateFrom || undefined}
                        value={filters.dateTo}
                        onChange={handleFieldChange}
                        disabled={disabled}
                        leftIcon={<IconCalendar className="h-4 w-4" stroke={1.75} />}
                    />
                </div>

                {/* Result Count & Reset Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2 lg:col-span-3 lg:justify-end">
                    {typeof filteredCount === "number" && typeof totalCount === "number" && (
                        <span className="text-xs text-ink-muted">
                            Showing{" "}
                            <strong className="font-semibold text-ink-primary">
                                {filteredCount}
                            </strong>{" "}
                            of {totalCount}
                        </span>
                    )}

                    {activeFilterCount > 0 && (
                        <div className="flex items-center gap-2">
                            <Badge variant="brand">{activeFilterCount} active</Badge>

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onReset}
                                disabled={disabled}
                                leftIcon={
                                    <IconRotateClockwise className="h-3.5 w-3.5" stroke={2} />
                                }
                            >
                                Reset
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
