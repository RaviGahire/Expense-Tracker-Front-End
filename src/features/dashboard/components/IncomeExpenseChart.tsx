import { useState } from 'react';
import {
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatCurrency } from '../../../utils';
import { formatCompactCurrency } from '../../../utils';

export interface MonthlyCashflowPoint {
  month: string;
  income: number;
  expense: number;
}

export interface IncomeExpenseChartProps {
  data: MonthlyCashflowPoint[];
  currency?: string;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function IncomeExpenseChart({
  data,
  currency = 'INR',
  isLoading = false,
  title = 'Income vs. Expenses',
  description = 'Monthly cashflow comparison across recent periods',
}: IncomeExpenseChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = data.reduce((sum, item) => sum + item.expense, 0);
  const netCashflow = totalIncome - totalExpense;

  const maxValue = Math.max(
    ...data.flatMap((item) => [item.income, item.expense]),
    1
  );

  // Clean 4-step Y-axis scale ticks (100%, 66%, 33%, 0)
  const yTicks = [maxValue, Math.round(maxValue * 0.66), Math.round(maxValue * 0.33), 0];

  if (isLoading) {
    return (
      <Card className="flex flex-col justify-between">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-44 animate-pulse rounded bg-surface-elevated" />
              <div className="h-3 w-56 animate-pulse rounded bg-surface-elevated" />
            </div>
            <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-elevated" />
          </div>

          <div className="mt-6 flex h-56 items-end justify-between gap-3 rounded-xl border border-subtle bg-surface-elevated/30 p-4">
            {[65, 85, 50, 95, 75, 80].map((height, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center gap-1.5">
                  <div
                    style={{ height: `${height}%` }}
                    className="w-3 animate-pulse rounded-t-md bg-surface-elevated sm:w-4"
                  />
                  <div
                    style={{ height: `${Math.max(25, height - 22)}%` }}
                    className="w-3 animate-pulse rounded-t-md bg-surface-elevated sm:w-4"
                  />
                </div>
                <div className="h-3 w-8 animate-pulse rounded bg-surface-elevated" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col justify-between">
      <div>
        {/* Header */}
        <CardHeader>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <IconChartBar className="h-5 w-5" stroke={1.75} />
          </div>
        </CardHeader>

        {/* Body */}
        <CardContent>
          {data.length === 0 ? (
            <EmptyState
              icon={<IconChartBar className="h-6 w-6" stroke={1.75} />}
              title="No cashflow data yet"
              description="Add income and expense transactions to visualize your monthly cashflow trends."
              className="py-10"
            />
          ) : (
            <div>
              {/* Legend & Period Totals Strip */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-elevated/40 px-4 py-3">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full bg-income"
                    />
                    <span className="text-xs font-medium text-ink-secondary">
                      Income
                    </span>
                    <span className="text-xs font-bold text-ink-primary">
                      {formatCompactCurrency(totalIncome, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full bg-expense"
                    />
                    <span className="text-xs font-medium text-ink-secondary">
                      Expenses
                    </span>
                    <span className="text-xs font-bold text-ink-primary">
                      {formatCompactCurrency(totalExpense, currency)}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={netCashflow >= 0 ? 'income' : 'expense'}
                  icon={
                    netCashflow >= 0 ? (
                      <IconTrendingUp className="h-3.5 w-3.5" stroke={2} />
                    ) : (
                      <IconTrendingDown className="h-3.5 w-3.5" stroke={2} />
                    )
                  }
                >
                  Net: {netCashflow >= 0 ? '+' : '-'}
                  {formatCompactCurrency(Math.abs(netCashflow), currency)}
                </Badge>
              </div>

              {/* Chart Area */}
              <div className="relative flex gap-3 pt-2">
                {/* Y-Axis Labels */}
                <div className="hidden h-52 flex-col justify-between pb-6 text-right text-[11px] font-medium text-ink-muted sm:flex">
                  {yTicks.map((tick, idx) => (
                    <span key={idx}>{formatCompactCurrency(tick, currency)}</span>
                  ))}
                </div>

                {/* Plot Grid + Grouped Bars */}
                <div className="relative flex-1">
                  {/* Horizontal Gridlines */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 flex h-46 flex-col justify-between"
                  >
                    {yTicks.map((_, idx) => (
                      <div
                        key={idx}
                        className="w-full border-b border-dashed border-subtle/80"
                      />
                    ))}
                  </div>

                  {/* Month Columns */}
                  <div className="relative z-10 flex h-52 items-end justify-between gap-2 sm:gap-4">
                    {data.map((point, index) => {
                      const incomeHeightPct = Math.max(
                        point.income > 0 ? 4 : 0,
                        Math.round((point.income / maxValue) * 100)
                      );
                      const expenseHeightPct = Math.max(
                        point.expense > 0 ? 4 : 0,
                        Math.round((point.expense / maxValue) * 100)
                      );
                      const isHovered = hoveredIndex === index;
                      const monthNet = point.income - point.expense;

                      return (
                        <div
                          key={point.month}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onFocus={() => setHoveredIndex(index)}
                          onBlur={() => setHoveredIndex(null)}
                          tabIndex={0}
                          aria-label={`${point.month}: Income ${formatCurrency(
                            point.income,
                            currency
                          )}, Expenses ${formatCurrency(point.expense, currency)}`}
                          className="group relative flex h-full flex-1 flex-col items-center justify-end focus:outline-none"
                        >
                          {/* Hover / Focus Tooltip */}
                          {isHovered && (
                            <div className="pointer-events-none absolute -top-2 z-20 w-44 -translate-y-full rounded-xl border border-subtle bg-surface p-3 shadow-2xl shadow-black/50">
                              <p className="mb-1.5 text-xs font-bold text-ink-primary">
                                {point.month}
                              </p>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-ink-secondary">Income:</span>
                                  <span className="font-semibold text-income">
                                    {formatCurrency(point.income, currency)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-ink-secondary">Expense:</span>
                                  <span className="font-semibold text-expense">
                                    {formatCurrency(point.expense, currency)}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center justify-between border-t border-subtle pt-1">
                                  <span className="text-ink-muted">Net:</span>
                                  <span
                                    className={`font-bold ${
                                      monthNet >= 0 ? 'text-income' : 'text-expense'
                                    }`}
                                  >
                                    {monthNet >= 0 ? '+' : '-'}
                                    {formatCurrency(Math.abs(monthNet), currency)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Grouped Bar Pair */}
                          <div
                            className={`flex h-46 w-full items-end justify-center gap-1 rounded-lg px-1 transition-colors duration-150 sm:gap-1.5 ${
                              isHovered ? 'bg-surface-elevated/50' : ''
                            }`}
                          >
                            {/* Income Bar */}
                            <div
                              style={{ height: `${incomeHeightPct}%` }}
                              className="w-2.5 rounded-t-md bg-income transition-all duration-300 group-hover:brightness-110 sm:w-3.5 md:w-4"
                            />
                            {/* Expense Bar */}
                            <div
                              style={{ height: `${expenseHeightPct}%` }}
                              className="w-2.5 rounded-t-md bg-expense transition-all duration-300 group-hover:brightness-110 sm:w-3.5 md:w-4"
                            />
                          </div>

                          {/* X-Axis Month Label */}
                          <span
                            className={`mt-2 text-xs font-medium transition-colors ${
                              isHovered ? 'text-ink-primary' : 'text-ink-muted'
                            }`}
                          >
                            {point.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </div>

      {/* Footer Note */}
      {data.length > 0 && (
        <CardFooter className="text-xs text-ink-muted">
          <span>Hover or focus any month bar for detailed cashflow</span>
          <span className="font-medium text-ink-secondary">
            {data.length}-month overview
          </span>
        </CardFooter>
      )}
    </Card>
  );
}