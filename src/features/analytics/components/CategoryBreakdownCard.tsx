import { useState, useMemo } from 'react';
import { IconChartDonut3 } from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { CategoryIcon } from '../../categories/components/CategoryIcon';
import type { CategoryBreakdownItem } from '../types/analytics.types';

export interface CategoryBreakdownCardProps {
  items: CategoryBreakdownItem[];
  type: 'expense' | 'income';
  onTypeChange: (nextType: 'expense' | 'income') => void;
  currency?: string;
}

interface DonutSegment extends CategoryBreakdownItem {
  strokeDasharray: string;
  strokeDashoffset: number;
}

const RING_RADIUS = 56;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatCategoryCurrency(
  amount: number,
  currency: string = 'INR'
): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function CategoryBreakdownCard({
  items,
  type,
  onTypeChange,
  currency = 'INR',
}: CategoryBreakdownCardProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.amount, 0),
    [items]
  );

  const segments = useMemo<DonutSegment[]>(() => {
    if (totalAmount <= 0) return [];

    let cumulativeLength = 0;

    return items.map((item) => {
      const fraction = item.amount / totalAmount;
      const segmentLength = fraction * RING_CIRCUMFERENCE;
      // Leave a subtle 2px visual gap when multiple segments exist
      const visibleLength =
        items.length > 1 ? Math.max(2, segmentLength - 2) : segmentLength;

      const segment: DonutSegment = {
        ...item,
        strokeDasharray: `${visibleLength} ${RING_CIRCUMFERENCE - visibleLength}`,
        strokeDashoffset: -cumulativeLength,
      };

      cumulativeLength += segmentLength;
      return segment;
    });
  }, [items, totalAmount]);

  const activeItem = useMemo(
    () => items.find((item) => item.category === hoveredCategory) ?? null,
    [items, hoveredCategory]
  );

  return (
    <Card className="flex flex-col justify-between gap-5">
      {/* Header & Expense / Income Toggle */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <IconChartDonut3 className="h-5 w-5" stroke={1.75} />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink-primary">
              Category Breakdown
            </h2>
            <p className="text-xs text-ink-secondary">
              {type === 'expense'
                ? 'Where your money goes by category'
                : 'Income sources across the selected period'}
            </p>
          </div>
        </div>

        <div
          role="group"
          aria-label="Category breakdown type"
          className="inline-flex rounded-xl border border-subtle bg-surface-elevated/60 p-1"
        >
          <button
            type="button"
            onClick={() => {
              setHoveredCategory(null);
              onTypeChange('expense');
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              type === 'expense'
                ? 'bg-expense text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Expenses
          </button>

          <button
            type="button"
            onClick={() => {
              setHoveredCategory(null);
              onTypeChange('income');
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              type === 'income'
                ? 'bg-income text-canvas shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Empty State vs. Donut + Ranked List */}
      {items.length === 0 || totalAmount <= 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-surface-elevated/25 px-4 text-center">
          <p className="text-sm font-semibold text-ink-primary">
            No {type} categories recorded
          </p>
          <p className="mt-1 max-w-sm text-xs text-ink-muted">
            Switch to {type === 'expense' ? 'Income' : 'Expenses'} or expand your reporting timeframe to inspect category shares.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Left: Interactive SVG Donut Ring */}
          <div className="relative mx-auto flex h-44 w-44 shrink-0 items-center justify-center lg:col-span-5">
            <svg
              viewBox="0 0 144 144"
              className="h-full w-full -rotate-90 transform overflow-visible"
              role="img"
              aria-label={`Donut chart showing ${type} distribution by category`}
            >
              {/* Base Track Ring */}
              <circle
                cx="72"
                cy="72"
                r={RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="16"
                className="text-surface-elevated"
              />

              {/* Category Segments */}
              {segments.map((segment) => {
                const isDimmed =
                  hoveredCategory !== null &&
                  hoveredCategory !== segment.category;

                return (
                  <circle
                    key={segment.category}
                    cx="72"
                    cy="72"
                    r={RING_RADIUS}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={hoveredCategory === segment.category ? 19 : 16}
                    strokeDasharray={segment.strokeDasharray}
                    strokeDashoffset={segment.strokeDashoffset}
                    strokeLinecap="butt"
                    onMouseEnter={() => setHoveredCategory(segment.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isDimmed ? 'opacity-35' : 'opacity-100'
                    }`}
                  />
                );
              })}
            </svg>

            {/* Center Donut Metric Readout */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
              <span className="max-w-[96px] truncate text-[11px] font-medium text-ink-muted">
                {activeItem
                  ? activeItem.category
                  : type === 'expense'
                  ? 'Total Spent'
                  : 'Total Earned'}
              </span>
              <span className="mt-0.5 text-base font-bold tracking-tight text-ink-primary">
                {formatCategoryCurrency(
                  activeItem ? activeItem.amount : totalAmount,
                  currency
                )}
              </span>
              <span className="mt-0.5 text-[11px] font-semibold text-brand">
                {activeItem
                  ? `${activeItem.percentage}%`
                  : `${items.length} ${
                      items.length === 1 ? 'category' : 'categories'
                    }`}
              </span>
            </div>
          </div>

          {/* Right: Ranked Category Share Bars */}
          <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1 lg:col-span-7">
            {items.map((item) => {
              const isHighlighted = hoveredCategory === item.category;

              return (
                <div
                  key={item.category}
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`rounded-xl border px-3 py-2.5 transition-colors ${
                    isHighlighted
                      ? 'border-brand/40 bg-surface-elevated/80'
                      : 'border-subtle/70 bg-surface-elevated/35 hover:bg-surface-elevated/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CategoryIcon
                        name={item.iconName}
                        label={item.category}
                        type={type}
                        // color={item.color}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink-primary">
                          {item.category}
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          {item.transactionCount}{' '}
                          {item.transactionCount === 1
                            ? 'transaction'
                            : 'transactions'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-ink-primary">
                        {formatCategoryCurrency(item.amount, currency)}
                      </p>
                      <p className="text-[11px] font-semibold text-ink-secondary">
                        {item.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Proportional Color Bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(3, item.percentage))}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}