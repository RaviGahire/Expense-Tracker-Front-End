export interface DashboardKPIs {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  iconName: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrendPoint {
  year: number;
  month: number;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface DashboardSummaryResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  kpis: DashboardKPIs;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    color: string;
    iconName: string;
    isDefault: boolean;
  }>;
  expenseByCategory: CategoryBreakdownItem[];
  recentTransactions: Array<{
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    title: string;
    date: string;
    accountId: { id: string; name: string; color: string; iconName: string };
    categoryId?: { id: string; name: string; color: string; iconName: string };
  }>;
  upcomingRecurring: Array<{
    id: string;
    type: 'income' | 'expense';
    amount: number;
    title: string;
    frequency: string;
    nextRunDate: string;
  }>;
}