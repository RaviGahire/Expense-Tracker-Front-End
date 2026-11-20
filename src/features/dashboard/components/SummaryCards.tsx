import type { ReactNode } from 'react';
import {
  IconWallet,
  IconArrowUpRight,
  IconArrowDownRight,
  IconPigMoney,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';

import { formatCurrency } from '../../../utils';
import { formatTrendLabel } from '../../../utils';

export interface SummaryStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  balanceChangePercent?: number;
  incomeChangePercent?: number;
  expenseChangePercent?: number;
  savingsChangePercent?: number;
}

export interface SummaryCardsProps {
  stats: SummaryStats;
  currency?: string;
  isLoading?: boolean;
}

interface MetricCardItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  icon: ReactNode;
  iconWrapperClass: string;
  trendPercent?: number;
  invertTrendColor?: boolean;
}



export const SummaryCards = ({
  stats,
  currency = 'INR',
  isLoading = false,
}: SummaryCardsProps) => {
  const metrics: MetricCardItem[] = [
    {
      id: 'total-balance',
      label: 'Total Balance',
      value: formatCurrency(stats.totalBalance, currency),
      subtext: 'Available across accounts',
      icon: <IconWallet className="h-5 w-5" stroke={1.75} />,
      iconWrapperClass: 'bg-brand/15 text-brand',
      trendPercent: stats.balanceChangePercent,
    },
    {
      id: 'monthly-income',
      label: 'Monthly Income',
      value: formatCurrency(stats.monthlyIncome, currency),
      subtext: 'Total earnings this period',
      icon: <IconArrowUpRight className="h-5 w-5" stroke={1.75} />,
      iconWrapperClass: 'bg-income/15 text-income',
      trendPercent: stats.incomeChangePercent,
    },
    {
      id: 'monthly-expenses',
      label: 'Monthly Expenses',
      value: formatCurrency(stats.monthlyExpenses, currency),
      subtext: 'Total spending this period',
      icon: <IconArrowDownRight className="h-5 w-5" stroke={1.75} />,
      iconWrapperClass: 'bg-expense/15 text-expense',
      trendPercent: stats.expenseChangePercent,
      invertTrendColor: true,
    },
    {
      id: 'savings-rate',
      label: 'Savings Rate',
      value: `${stats.savingsRate.toFixed(1)}%`,
      subtext: 'Of monthly income saved',
      icon: <IconPigMoney className="h-5 w-5" stroke={1.75} />,
      iconWrapperClass: 'bg-accent/15 text-accent',
      trendPercent: stats.savingsChangePercent,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((skeleton) => (
          <Card key={skeleton} className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-surface-elevated" />
              <div className="h-5 w-14 rounded-full bg-surface-elevated" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3.5 w-24 rounded bg-surface-elevated" />
              <div className="h-7 w-32 rounded bg-surface-elevated" />
              <div className="h-3 w-28 rounded bg-surface-elevated" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item) => {
        const hasTrend = typeof item.trendPercent === 'number';
        const isPositive = (item.trendPercent ?? 0) >= 0;

        // For expenses, a decrease (-) is good (income/green) and an increase (+) is bad (expense/red)
        let badgeVariant: BadgeVariant = 'neutral';
        if (hasTrend) {
          const isGood = item.invertTrendColor ? !isPositive : isPositive;
          badgeVariant = isGood ? 'income' : 'expense';
        }

        return (
          <Card key={item.id} hoverable className="flex flex-col justify-between">
            {/* Top Row: Custom Token Icon Box + Optional Trend Badge */}
            <div className="flex items-center justify-between gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconWrapperClass}`}
              >
                {item.icon}
              </div>

              {hasTrend && typeof item.trendPercent === 'number' && (
                <Badge
                  variant={badgeVariant}
                  icon={
                    isPositive ? (
                      <IconTrendingUp className="h-3.5 w-3.5" stroke={2} />
                    ) : (
                      <IconTrendingDown className="h-3.5 w-3.5" stroke={2} />
                    )
                  }
                >
                  {formatTrendLabel(item.trendPercent)}
                </Badge>
              )}
            </div>

            {/* Bottom Row: Metric Label, Main Figure & Context */}
            <div className="mt-4">
              <p className="text-xs font-medium text-ink-secondary">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-ink-primary">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-ink-muted">{item.subtext}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}