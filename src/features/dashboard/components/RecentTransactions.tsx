import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconReceipt,
  IconArrowRight,
  IconArrowUpRight,
  IconArrowDownRight,
  IconPlus,
  IconToolsKitchen2,
  IconHome,
  IconCar,
  IconShoppingBag,
  IconBolt,
  IconBriefcase,
  IconDeviceLaptop,
  IconHeartbeat,
  IconCategory,
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
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import type { TransactionType } from '../types/TransactionType';
import { formatTransactionDate } from '../../../utils';
import { formatCurrency } from '../../../utils';

export interface RecentTransactionItem {
  id: string;
  title: string;
  category: string;
  type: TransactionType;
  amount: number;
  date: string;
  paymentMethod?: string;
}

export interface RecentTransactionsProps {
  transactions: RecentTransactionItem[];
  currency?: string;
  isLoading?: boolean;
  maxItems?: number;
  onAddTransaction?: () => void;
}


function getCategoryVisual(
  category: string,
  type: TransactionType
): { icon: ReactNode; badgeClass: string } {

  const normalized = category.trim().toLowerCase();

  if (type === 'income') {
    if (normalized.includes('salary') || normalized.includes('job')) {
      return {
        icon: <IconBriefcase className="h-4 w-4" stroke={1.75} />,
        badgeClass: 'bg-income/15 text-income',
      };
    }
    if (normalized.includes('freelance') || normalized.includes('client')) {
      return {
        icon: <IconDeviceLaptop className="h-4 w-4" stroke={1.75} />,
        badgeClass: 'bg-income/15 text-income',
      };
    }
    return {
      icon: <IconArrowUpRight className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-income/15 text-income',
    };
  }

  if (normalized.includes('food') || normalized.includes('dining')) {
    return {
      icon: <IconToolsKitchen2 className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-warning/15 text-warning',
    };
  }
  if (normalized.includes('rent') || normalized.includes('housing')) {
    return {
      icon: <IconHome className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-brand/15 text-brand',
    };
  }
  if (normalized.includes('transport') || normalized.includes('travel') || normalized.includes('fuel')) {
    return {
      icon: <IconCar className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-accent/15 text-accent',
    };
  }
  if (normalized.includes('shop')) {
    return {
      icon: <IconShoppingBag className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-expense/15 text-expense',
    };
  }
  if (normalized.includes('bill') || normalized.includes('utilit')) {
    return {
      icon: <IconBolt className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-warning/15 text-warning',
    };
  }
  if (normalized.includes('health') || normalized.includes('medical')) {
    return {
      icon: <IconHeartbeat className="h-4 w-4" stroke={1.75} />,
      badgeClass: 'bg-expense/15 text-expense',
    };
  }

  return {
    icon: <IconCategory className="h-4 w-4" stroke={1.75} />,
    badgeClass: 'bg-surface-elevated text-ink-secondary',
  };
}

export const RecentTransactions =({
  transactions,
  currency = 'INR',
  isLoading = false,
  maxItems = 5,
  onAddTransaction,
}: RecentTransactionsProps)=> {
  const navigate = useNavigate();
  const visibleTransactions = transactions.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card className="flex flex-col justify-between">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-surface-elevated" />
              <div className="h-3 w-52 animate-pulse rounded bg-surface-elevated" />
            </div>
            <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-elevated" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((skeleton) => (
              <div
                key={skeleton}
                className="flex animate-pulse items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-elevated/40 p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-surface-elevated" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-32 rounded bg-surface-elevated" />
                    <div className="h-3 w-24 rounded bg-surface-elevated" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="ml-auto h-3.5 w-20 rounded bg-surface-elevated" />
                  <div className="ml-auto h-4 w-14 rounded-full bg-surface-elevated" />
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
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest recorded income and expenses
            </CardDescription>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <IconReceipt className="h-5 w-5" stroke={1.75} />
          </div>
        </CardHeader>

        {/* Body */}
        <CardContent>
          {visibleTransactions.length === 0 ? (
            <EmptyState
              icon={<IconReceipt className="h-6 w-6" stroke={1.75} />}
              title="No transactions yet"
              description="Record your first income or expense to start seeing recent activity here."
              actionLabel="Add Transaction"
              actionIcon={<IconPlus className="h-4 w-4" stroke={2} />}
              onAction={onAddTransaction || (() => navigate('/transactions'))}
              className="py-8"
            />
          ) : (
            <div className="space-y-2.5">
              {visibleTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const visual = getCategoryVisual(tx.category, tx.type);

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-elevated/40 p-3.5 transition-colors hover:border-ink-muted/40 hover:bg-surface-elevated/70"
                  >
                    {/* Left: Category Icon + Title & Metadata */}
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.badgeClass}`}
                      >
                        {visual.icon}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-primary">
                          {tx.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                          <span className="truncate text-ink-secondary">
                            {tx.category}
                          </span>
                          <span aria-hidden="true">•</span>
                          <span>{formatTransactionDate(tx.date)}</span>
                          {tx.paymentMethod && (
                            <>
                              <span aria-hidden="true" className="hidden sm:inline">
                                •
                              </span>
                              <span className="hidden sm:inline">
                                {tx.paymentMethod}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Signed Currency Amount + Type Badge */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`text-sm font-bold tracking-tight ${
                          isIncome ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </span>

                      <Badge
                        variant={isIncome ? 'income' : 'expense'}
                        icon={
                          isIncome ? (
                            <IconArrowUpRight className="h-3 w-3" stroke={2} />
                          ) : (
                            <IconArrowDownRight className="h-3 w-3" stroke={2} />
                          )
                        }
                      >
                        {isIncome ? 'Income' : 'Expense'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>

      {/* Footer Navigation */}
      {visibleTransactions.length > 0 && (
        <CardFooter className="flex-wrap gap-3">
          <span className="text-xs text-ink-muted">
            Showing latest {visibleTransactions.length} of {transactions.length}{' '}
            entries
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/transactions')}
            rightIcon={<IconArrowRight className="h-4 w-4" stroke={1.75} />}
          >
            View All Transactions
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}