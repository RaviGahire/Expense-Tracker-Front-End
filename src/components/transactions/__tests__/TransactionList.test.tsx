import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionList } from '../../../features/transactions/components/TransactionList';

const sampleTransactions = [
  {
    id: 'txn_1',
    title: 'Grocery Store',
    type: 'expense' as const,
    amount: 1250,
    category: { id: 'cat_1', name: 'Food & Dining' },
    account: { id: 'acc_1', name: 'Cash' },
    date: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 'txn_2',
    title: 'Monthly Salary',
    type: 'income' as const,
    amount: 85000,
    category: { id: 'cat_2', name: 'Salary' },
    account: { id: 'acc_2', name: 'HDFC Bank' },
    date: '2026-11-01T09:00:00.000Z',
  },
  {
    id: 'txn_3',
    title: 'Electricity Bill',
    type: 'expense' as const,
    amount: 2100,
    category: { id: 'cat_3', name: 'Utilities' },
    account: { id: 'acc_2', name: 'HDFC Bank' },
    date: '2026-11-10T14:30:00.000Z',
  },
];

describe('TransactionList & Filtering', () => {
  it('renders all transactions initially', () => {
    render(
      <TransactionList
        transactions={sampleTransactions as never}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    expect(screen.getByText('Monthly Salary')).toBeInTheDocument();
    expect(screen.getByText('Electricity Bill')).toBeInTheDocument();
  });

  it('filters transactions by type (Expense vs Income)', async () => {
    const user = userEvent.setup();

    render(
      <TransactionList
        transactions={sampleTransactions as never}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /^income$/i }));

    expect(screen.getByText('Monthly Salary')).toBeInTheDocument();
    expect(screen.queryByText('Grocery Store')).not.toBeInTheDocument();
    expect(screen.queryByText('Electricity Bill')).not.toBeInTheDocument();
  });

  it('filters transactions via search input and shows empty state when none match', async () => {
    const user = userEvent.setup();

    render(
      <TransactionList
        transactions={sampleTransactions as never}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Grocery');

    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    expect(screen.queryByText('Monthly Salary')).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'NonExistentItemXYZ');

    expect(
      screen.getByText(/no transactions found|no matching transactions/i)
    ).toBeInTheDocument();
  });
});