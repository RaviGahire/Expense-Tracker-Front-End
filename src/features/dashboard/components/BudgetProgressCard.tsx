import { useNavigate } from 'react-router-dom';
import {
  IconTargetArrow,
  IconArrowRight,
  IconPlus,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../components/ui/Card';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatCurrency } from '../../../utils';

export interface BudgetItem {
  id: string;
  category: string;
  spent: number;
  limit: number;
  period?: string;
}

export interface BudgetProgressCardProps {
  budgets: BudgetItem[];
  currency?: string;
  isLoading?: boolean;
  maxItems?: number;
  onCreateBudget?: () => void;
}



function getBudgetStatus(
  spent: number,
  limit: number
): { label: string; variant: BadgeVariant; percentage: number } {
  const safeLimit = limit > 0 ? limit : 1;
  const percentage = (spent / safeLimit) * 100;

  if (percentage >= 100) {
    return { label: 'Exceeded', variant: 'expense', percentage };
  }
  if (percentage >= 75) {
    return { label: 'Near Limit', variant: 'warning', percentage };
  }
  return { label: 'On Track', variant: 'income', percentage };
}

export function BudgetProgressCard({
  budgets,
  currency = 'INR',
  isLoading = false,
  maxItems = 4,
  onCreateBudget,
}: BudgetProgressCardProps) {
  const navigate = useNavigate();

  const visibleBudgets = budgets.slice(0, maxItems);
  const totalLimit = budgets.reduce((sum, item) => sum + item.limit, 0);
  const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalLimit - totalSpent;

  if (isLoading) {
    return (
      <Card className="flex flex-col justify-between">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-36 animate-pulse rounded bg-surface-elevated" />
              <div className="h-3 w-48 animate-pulse rounded bg-surface-elevated" />
            </div>
            <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-elevated" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((skeleton) => (
              <div
                key={skeleton}
                className="animate-pulse rounded-xl border border-subtle bg-surface-elevated/40 p-3.5"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="h-3.5 w-24 rounded bg-surface-elevated" />
                  <div className="h-5 w-16 rounded-full bg-surface-elevated" />
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-elevated" />
                <div className="mt-2 flex justify-between">
                  <div className="h-3 w-28 rounded bg-surface-elevated" />
                  <div className="h-3 w-16 rounded bg-surface-elevated" />
                </div>
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
            <CardTitle>Monthly Budgets</CardTitle>
            <CardDescription>
              Category spending limits for the current cycle
            </CardDescription>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <IconTargetArrow className="h-5 w-5" stroke={1.75} />
          </div>
        </CardHeader>

        {/* Body */}
        <CardContent>
          {visibleBudgets.length === 0 ? (
            <EmptyState
              icon={<IconTargetArrow className="h-6 w-6" stroke={1.75} />}
              title="No budgets configured"
              description="Set category spending limits to keep your monthly expenses under control."
              actionLabel="Create Budget"
              actionIcon={<IconPlus className="h-4 w-4" stroke={2} />}
              onAction={onCreateBudget || (() => navigate('/budgets'))}
              className="py-8"
            />
          ) : (
            <div className="space-y-3.5">
              {visibleBudgets.map((budget) => {
                const status = getBudgetStatus(budget.spent, budget.limit);
                const remaining = budget.limit - budget.spent;
                const isOver = remaining < 0;

                return (
                  <div
                    key={budget.id}
                    className="rounded-xl border border-subtle bg-surface-elevated/40 p-3.5 transition-colors hover:border-ink-muted/40"
                  >
                    {/* Top Row: Category Name + Status Badge */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate text-sm font-semibold text-ink-primary">
                          {budget.category}
                        </span>
                        {budget.period && (
                          <span className="text-[11px] text-ink-muted">
                            ({budget.period})
                          </span>
                        )}
                      </div>

                      <Badge
                        variant={status.variant}
                        dot={status.variant !== 'expense'}
                        icon={
                          status.variant === 'expense' ? (
                            <IconAlertTriangle className="h-3 w-3" stroke={2} />
                          ) : undefined
                        }
                      >
                        {status.label}
                      </Badge>
                    </div>

                    {/* Progress Track (uses auto threshold colors: brand <75%, warning >=75%, expense >=100%) */}
                    <ProgressBar
                      value={budget.spent}
                      max={budget.limit}
                      size="md"
                    />

                    {/* Bottom Row: Spent vs Limit + Remaining / Over Amount */}
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                      <span className="text-ink-secondary">
                        <strong className="font-semibold text-ink-primary">
                          {formatCurrency(budget.spent, currency)}
                        </strong>{' '}
                        of {formatCurrency(budget.limit, currency)}
                      </span>

                      <span
                        className={`font-medium ${
                          isOver
                            ? 'text-expense'
                            : status.variant === 'warning'
                            ? 'text-warning'
                            : 'text-ink-muted'
                        }`}
                      >
                        {isOver
                          ? `${formatCurrency(Math.abs(remaining), currency)} over`
                          : `${formatCurrency(remaining, currency)} left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>

      {/* Footer Summary + Navigation Action */}
      {visibleBudgets.length > 0 && (
        <CardFooter className="flex-wrap gap-3">
          <div className="text-xs text-ink-secondary">
            Total remaining:{' '}
            <span
              className={`font-semibold ${
                totalRemaining < 0 ? 'text-expense' : 'text-income'
              }`}
            >
              {totalRemaining < 0
                ? `-${formatCurrency(Math.abs(totalRemaining), currency)}`
                : formatCurrency(totalRemaining, currency)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/budgets')}
            rightIcon={<IconArrowRight className="h-4 w-4" stroke={1.75} />}
          >
            Manage Budgets
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}