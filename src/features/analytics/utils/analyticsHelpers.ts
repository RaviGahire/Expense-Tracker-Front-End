import type { TransactionRecord } from '../../transactions/components/TransactionItem';
import type {
  AnalyticsSummary,
  AnalyticsTimeframe,
  CategoryBreakdownItem,
  MonthlyCashflowPoint,
  PaymentMethodBreakdownItem,
} from '../types/analytics.types';

export interface CategoryMetaLookup {
  color?: string;
  iconName?: string;
}

const FALLBACK_CHART_COLORS = [
  '#38bdf8', // sky
  '#a78bfa', // violet
  '#f472b6', // pink
  '#fb923c', // orange
  '#34d399', // emerald
  '#facc15', // yellow
  '#60a5fa', // blue
  '#f87171', // red
];

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeframeStartDate(
  timeframe: AnalyticsTimeframe,
  referenceDate: Date = new Date()
): string | null {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  switch (timeframe) {
    case 'this_month':
      return formatLocalDate(new Date(year, month, 1));
    case 'last_3_months':
      return formatLocalDate(new Date(year, month - 2, 1));
    case 'last_6_months':
      return formatLocalDate(new Date(year, month - 5, 1));
    case 'this_year':
      return formatLocalDate(new Date(year, 0, 1));
    case 'all_time':
    default:
      return null;
  }
}

export function filterTransactionsByTimeframe(
  transactions: TransactionRecord[],
  timeframe: AnalyticsTimeframe
): TransactionRecord[] {
  const startDate = getTimeframeStartDate(timeframe);
  if (!startDate) return transactions;
  return transactions.filter((tx) => tx.date >= startDate);
}

export function buildAnalyticsSummary(
  transactions: TransactionRecord[],
  timeframe: AnalyticsTimeframe
): AnalyticsSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let largestExpenseTitle: string | null = null;
  let largestExpenseAmount = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      if (tx.amount > largestExpenseAmount) {
        largestExpenseAmount = tx.amount;
        largestExpenseTitle = tx.title;
      }
    }
  }

  const netSavings = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const activeDays = resolveActiveDaySpan(transactions, timeframe);
  const averageDailySpend =
    activeDays > 0 ? Math.round(totalExpense / activeDays) : 0;

  return {
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    averageDailySpend,
    largestExpenseTitle,
    largestExpenseAmount,
    transactionCount: transactions.length,
  };
}

function resolveActiveDaySpan(
  transactions: TransactionRecord[],
  timeframe: AnalyticsTimeframe
): number {
  const now = new Date();
  if (timeframe === 'this_month') {
    return Math.max(1, now.getDate());
  }

  const startStr = getTimeframeStartDate(timeframe, now);
  if (startStr) {
    const [y, m, d] = startStr.split('-').map(Number);
    const startUtc = Date.UTC(y, m - 1, d);
    const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(1, Math.round((nowUtc - startUtc) / 86_400_000) + 1);
  }

  if (transactions.length === 0) return 1;

  let earliest = transactions[0].date;
  for (const tx of transactions) {
    if (tx.date < earliest) earliest = tx.date;
  }

  const [y, m, d] = earliest.split('-').map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return 1;

  const startUtc = Date.UTC(y, m - 1, d);
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.round((nowUtc - startUtc) / 86_400_000) + 1);
}

export function buildMonthlyCashflowSeries(
  transactions: TransactionRecord[],
  timeframe: AnalyticsTimeframe
): MonthlyCashflowPoint[] {
  const bucketMap = new Map<string, { income: number; expense: number }>();

  // Pre-seed continuous month buckets for bounded timeframes so zero-activity months still render cleanly
  const now = new Date();
  const monthsToSeed =
    timeframe === 'this_month'
      ? 1
      : timeframe === 'last_3_months'
      ? 3
      : timeframe === 'last_6_months'
      ? 6
      : timeframe === 'this_year'
      ? now.getMonth() + 1
      : 0;

  if (monthsToSeed > 0) {
    for (let i = monthsToSeed - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      bucketMap.set(key, { income: 0, expense: 0 });
    }
  }

  for (const tx of transactions) {
    const monthKey = tx.date.slice(0, 7); // YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(monthKey)) continue;

    const current = bucketMap.get(monthKey) ?? { income: 0, expense: 0 };
    if (tx.type === 'income') {
      current.income += tx.amount;
    } else {
      current.expense += tx.amount;
    }
    bucketMap.set(monthKey, current);
  }

  const sortedKeys = Array.from(bucketMap.keys()).sort((a, b) =>
    a.localeCompare(b)
  );

  return sortedKeys.map((monthKey) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, 1);
    const label = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(dateObj);
    const shortLabel = new Intl.DateTimeFormat('en-US', {
      month: 'short',
    }).format(dateObj);

    const totals = bucketMap.get(monthKey) ?? { income: 0, expense: 0 };
    const net = totals.income - totals.expense;
    const savingsRate =
      totals.income > 0 ? Math.round((net / totals.income) * 100) : 0;

    return {
      monthKey,
      label,
      shortLabel,
      income: totals.income,
      expense: totals.expense,
      net,
      savingsRate,
    };
  });
}

export function buildCategoryBreakdown(
  transactions: TransactionRecord[],
  type: 'expense' | 'income',
  getCategoryMeta: (categoryName: string) => CategoryMetaLookup | undefined
): CategoryBreakdownItem[] {
  const filtered = transactions.filter((tx) => tx.type === type);
  const grouped = new Map<string, { amount: number; count: number }>();

  let grandTotal = 0;
  for (const tx of filtered) {
    grandTotal += tx.amount;
    const current = grouped.get(tx.category) ?? { amount: 0, count: 0 };
    current.amount += tx.amount;
    current.count += 1;
    grouped.set(tx.category, current);
  }

  const entries = Array.from(grouped.entries()).sort(
    (a, b) => b[1].amount - a[1].amount
  );

  return entries.map(([category, stats], index) => {
    const meta = getCategoryMeta(category);
    const color =
      meta?.color ||
      FALLBACK_CHART_COLORS[index % FALLBACK_CHART_COLORS.length];

    return {
      category,
      amount: stats.amount,
      percentage:
        grandTotal > 0 ? Math.round((stats.amount / grandTotal) * 1000) / 10 : 0,
      transactionCount: stats.count,
      color,
      iconName: meta?.iconName,
    };
  });
}

export function buildPaymentMethodBreakdown(
  transactions: TransactionRecord[]
): PaymentMethodBreakdownItem[] {
  const expensesOnly = transactions.filter((tx) => tx.type === 'expense');
  const grouped = new Map<string, { amount: number; count: number }>();

  let grandTotal = 0;
  for (const tx of expensesOnly) {
    grandTotal += tx.amount;
    const method = tx.paymentMethod || 'Other';
    const current = grouped.get(method) ?? { amount: 0, count: 0 };
    current.amount += tx.amount;
    current.count += 1;
    grouped.set(method, current);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([method, stats]) => ({
      method,
      amount: stats.amount,
      percentage:
        grandTotal > 0 ? Math.round((stats.amount / grandTotal) * 1000) / 10 : 0,
      transactionCount: stats.count,
      averageAmount:
        stats.count > 0 ? Math.round(stats.amount / stats.count) : 0,
    }));
}

export function exportTransactionsToCsv(
  transactions: TransactionRecord[],
  filename: string
): void {
  const headers = [
    'Date',
    'Title',
    'Type',
    'Category',
    'Payment Method',
    'Amount',
    'Notes',
  ];

  const escapeCsvCell = (value: string | number | undefined): string => {
    const str = String(value ?? '');
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = transactions.map((tx) =>
    [
      tx.date,
      tx.title,
      tx.type,
      tx.category,
      tx.paymentMethod,
      tx.amount,
      tx.notes ?? '',
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}