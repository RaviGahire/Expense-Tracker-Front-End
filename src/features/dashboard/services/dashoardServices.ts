import { apiRequest } from '../../../services/apiClient';
import { accountService } from '../../accounts/services/accountService';
import {
  budgetService,
  getCurrentMonthString,
} from '../../budgets/services/budgetService';
import { transactionService } from '../../transactions/services/transactionService';
import type { SummaryStats } from '../components/SummaryCards';
import type { BudgetItem } from '../components/BudgetProgressCard';
import type { RecentTransactionItem } from '../components/RecentTransactions';
import type { MonthlyCashflowPoint } from '../components/IncomeExpenseChart';
import type { QuickTransactionPayload } from '../components/QuickAddButton';

export type DashboardPeriod = 'this_month' | 'last_30_days' | 'this_year';

export interface DashboardData {
  stats: SummaryStats;
  budgets: BudgetItem[];
  recentTransactions: RecentTransactionItem[];
  cashflow: MonthlyCashflowPoint[];
}

const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getPeriodDateRange(period: DashboardPeriod): {
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = now.toISOString().slice(0, 10);

  if (period === 'this_year') {
    return {
      startDate: `${year}-01-01`,
      endDate: todayStr,
      prevStartDate: `${year - 1}-01-01`,
      prevEndDate: `${year - 1}-12-31`,
    };
  }

  if (period === 'last_30_days') {
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    const prevEnd = new Date(start);
    prevEnd.setDate(start.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - 30);

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: todayStr,
      prevStartDate: prevStart.toISOString().slice(0, 10),
      prevEndDate: prevEnd.toISOString().slice(0, 10),
    };
  }

  // this_month
  const start = new Date(year, month, 1);
  const prevStart = new Date(year, month - 1, 1);
  const prevEnd = new Date(year, month, 0);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: todayStr,
    prevStartDate: prevStart.toISOString().slice(0, 10),
    prevEndDate: prevEnd.toISOString().slice(0, 10),
  };
}

function calcPercentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export const dashboardService = {
  isRemoteEnabled(): boolean {
    return true;
  },

  async getDashboardData(period: DashboardPeriod): Promise<DashboardData> {
    const currentMonth = getCurrentMonthString();
    const { startDate, endDate, prevStartDate, prevEndDate } =
      getPeriodDateRange(period);

    const [accounts, rawBudgets, allTransactions, analyticsSummary] =
      await Promise.all([
        accountService.getAll(),
        budgetService.getAll(currentMonth),
        transactionService.getAll(),
        apiRequest<Partial<DashboardData> & { data?: Partial<DashboardData> }>(
          `/analytics/overview?period=${encodeURIComponent(period)}`
        ).catch(() => null),
      ]);

    const directPayload = analyticsSummary?.data ?? analyticsSummary;
    if (
      directPayload &&
      directPayload.stats &&
      Array.isArray(directPayload.budgets) &&
      Array.isArray(directPayload.recentTransactions) &&
      Array.isArray(directPayload.cashflow)
    ) {
      return directPayload as DashboardData;
    }

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + (Number(acc.balance) || 0),
      0
    );

    const periodTxs = allTransactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate
    );
    const prevPeriodTxs = allTransactions.filter(
      (tx) => tx.date >= prevStartDate && tx.date <= prevEndDate
    );

    const monthlyIncome = periodTxs
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyExpenses = periodTxs
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const prevIncome = prevPeriodTxs
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const prevExpenses = prevPeriodTxs
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const savingsRate =
      monthlyIncome > 0
        ? Number(
            (((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(1)
          )
        : 0;
    const prevSavingsRate =
      prevIncome > 0
        ? ((prevIncome - prevExpenses) / prevIncome) * 100
        : 0;

    // Calculate spent amount per category for budget progress cards
    const spentByCategory = new Map<string, number>();
    for (const tx of periodTxs) {
      if (tx.type !== 'expense') continue;
      const key = tx.category.trim().toLowerCase();
      spentByCategory.set(key, (spentByCategory.get(key) ?? 0) + tx.amount);
    }

    const budgets: BudgetItem[] = rawBudgets.map((b) => ({
      id: b.id,
      category: b.category,
      spent: spentByCategory.get(b.category.trim().toLowerCase()) ?? 0,
      limit: b.limit,
      period:
        b.period === 'yearly'
          ? 'Yearly'
          : b.period === 'weekly'
          ? 'Weekly'
          : 'Monthly',
    }));

    const recentTransactions: RecentTransactionItem[] = [...allTransactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)
      .map((tx) => ({
        id: tx.id,
        title: tx.title,
        category: tx.category,
        type: tx.type,
        amount: tx.amount,
        date: tx.date,
        paymentMethod: tx.paymentMethod,
      }));

    // Build last 6 months cashflow series from live transactions
    const now = new Date();
    const cashflow: MonthlyCashflowPoint[] = [];
    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthTxs = allTransactions.filter((tx) => tx.date.startsWith(ym));

      cashflow.push({
        month: MONTH_SHORT_NAMES[d.getMonth()],
        income: monthTxs
          .filter((tx) => tx.type === 'income')
          .reduce((sum, tx) => sum + tx.amount, 0),
        expense: monthTxs
          .filter((tx) => tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0),
      });
    }

    return {
      stats: {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        balanceChangePercent: calcPercentChange(
          monthlyIncome - monthlyExpenses,
          prevIncome - prevExpenses
        ),
        incomeChangePercent: calcPercentChange(monthlyIncome, prevIncome),
        expenseChangePercent: calcPercentChange(monthlyExpenses, prevExpenses),
        savingsChangePercent: Number(
          (savingsRate - prevSavingsRate).toFixed(1)
        ),
      },
      budgets,
      recentTransactions,
      cashflow,
    };
  },

  async createQuickTransaction(
    payload: QuickTransactionPayload
  ): Promise<RecentTransactionItem> {
    const created = await transactionService.create({
      title: payload.title,
      amount: payload.amount,
      type: payload.type,
      category: payload.category,
      paymentMethod: payload.paymentMethod,
      date: payload.date,
    });

    return {
      id: created.id,
      title: created.title,
      category: created.category,
      type: created.type,
      amount: created.amount,
      date: created.date,
      paymentMethod: created.paymentMethod,
    };
  },
};