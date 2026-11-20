import { authService } from '../../auth/services/authService';
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

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders(): HeadersInit {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildMockDashboardData(period: DashboardPeriod): DashboardData {
  const multiplier =
    period === 'this_year' ? 11 : period === 'last_30_days' ? 1.05 : 1;

  const monthlyIncome = Math.round(95000 * multiplier);
  const monthlyExpenses = Math.round(48250 * multiplier);
  const totalBalance = 246800 + (monthlyIncome - monthlyExpenses);
  const savingsRate =
    monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;

  return {
    stats: {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      balanceChangePercent: 12.4,
      incomeChangePercent: 6.2,
      expenseChangePercent: -4.8,
      savingsChangePercent: 8.1,
    },
    budgets: [
      {
        id: 'bdg_1',
        category: 'Food & Dining',
        spent: Math.round(9200 * (period === 'this_year' ? 10 : 1)),
        limit: Math.round(12000 * (period === 'this_year' ? 12 : 1)),
        period: period === 'this_year' ? 'Yearly' : 'Monthly',
      },
      {
        id: 'bdg_2',
        category: 'Housing & Rent',
        spent: Math.round(18000 * (period === 'this_year' ? 11 : 1)),
        limit: Math.round(18000 * (period === 'this_year' ? 12 : 1)),
        period: period === 'this_year' ? 'Yearly' : 'Monthly',
      },
      {
        id: 'bdg_3',
        category: 'Transport & Fuel',
        spent: Math.round(4350 * (period === 'this_year' ? 10.5 : 1)),
        limit: Math.round(5000 * (period === 'this_year' ? 12 : 1)),
        period: period === 'this_year' ? 'Yearly' : 'Monthly',
      },
      {
        id: 'bdg_4',
        category: 'Shopping',
        spent: Math.round(8900 * (period === 'this_year' ? 11.5 : 1)),
        limit: Math.round(8000 * (period === 'this_year' ? 12 : 1)),
        period: period === 'this_year' ? 'Yearly' : 'Monthly',
      },
    ],
    recentTransactions: [
      {
        id: 'tx_1',
        title: 'Monthly Tech Salary',
        category: 'Salary',
        type: 'income',
        amount: 95000,
        date: '2026-11-01',
        paymentMethod: 'Bank Transfer',
      },
      {
        id: 'tx_2',
        title: 'Apartment Rent - Pune',
        category: 'Housing & Rent',
        type: 'expense',
        amount: 18000,
        date: '2026-11-05',
        paymentMethod: 'UPI',
      },
      {
        id: 'tx_3',
        title: 'Fresh Mart Groceries',
        category: 'Food & Dining',
        type: 'expense',
        amount: 3450,
        date: '2026-11-12',
        paymentMethod: 'UPI',
      },
      {
        id: 'tx_4',
        title: 'Freelance UI Audit',
        category: 'Freelance',
        type: 'income',
        amount: 14500,
        date: '2026-11-15',
        paymentMethod: 'Bank Transfer',
      },
      {
        id: 'tx_5',
        title: 'Electricity & Fiber Internet',
        category: 'Bills & Utilities',
        type: 'expense',
        amount: 2680,
        date: '2026-11-18',
        paymentMethod: 'Debit Card',
      },
    ],
    cashflow: [
      { month: 'Jun', income: 88000, expense: 51200 },
      { month: 'Jul', income: 92000, expense: 49800 },
      { month: 'Aug', income: 88000, expense: 54600 },
      { month: 'Sep', income: 96500, expense: 47900 },
      { month: 'Oct', income: 91000, expense: 50400 },
      { month: 'Nov', income: 109500, expense: 48250 },
    ],
  };
}

export const dashboardService = {
  isRemoteEnabled(): boolean {
    return Boolean(API_BASE_URL);
  },

  async getDashboardData(period: DashboardPeriod): Promise<DashboardData> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard?period=${encodeURIComponent(period)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load dashboard data.');
      }

      return data as DashboardData;
    }

    await new Promise((resolve) => setTimeout(resolve, 450));
    return buildMockDashboardData(period);
  },

  async createQuickTransaction(
    payload: QuickTransactionPayload
  ): Promise<RecentTransactionItem> {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save transaction.');
      }

      return (data.transaction ?? data) as RecentTransactionItem;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      id: `tx_${Date.now()}`,
      title: payload.title,
      category: payload.category,
      type: payload.type,
      amount: payload.amount,
      date: payload.date,
      paymentMethod: payload.paymentMethod,
    };
  },
};