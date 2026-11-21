import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionForm } from '../../../features/transactions/components/TransactionForm';

const mockAccounts = [
  { id: 'acc_1', name: 'Cash', type: 'cash', balance: 5000 },
  { id: 'acc_2', name: 'HDFC Bank', type: 'bank', balance: 45000 },
];

const mockCategories = [
  { id: 'cat_1', name: 'Food & Dining', type: 'expense' },
  { id: 'cat_2', name: 'Salary', type: 'income' },
];

describe('TransactionForm', () => {
  const onSubmitMock = vi.fn();
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents submission and shows validation error when amount is empty or zero', async () => {
    const user = userEvent.setup();

    render(
      <TransactionForm
        initialValues={mockAccounts as never}
        submitLabel={mockCategories as never}
        onSubmit={onSubmitMock}
        onCancel={onCloseMock}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /save|add transaction/i })
    );

    expect(onSubmitMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/amount.*greater than|enter a valid amount/i)
    ).toBeInTheDocument();
  });

  it('submits a valid expense transaction with selected category and account', async () => {
    const user = userEvent.setup();
    onSubmitMock.mockResolvedValueOnce(undefined);

    render(
      <TransactionForm
          initialValues={mockAccounts as never}
        submitLabel={mockCategories as never}
        onSubmit={onSubmitMock}
        onCancel={onCloseMock}
      />
    );

    await user.type(screen.getByLabelText(/amount/i), '450');
    await user.type(
      screen.getByLabelText(/title|description|note/i),
      'Lunch at cafe'
    );
    await user.selectOptions(screen.getByLabelText(/category/i), 'cat_1');
    await user.selectOptions(screen.getByLabelText(/account/i), 'acc_2');

    await user.click(
      screen.getByRole('button', { name: /save|add transaction/i })
    );

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expense',
          amount: 450,
          categoryId: 'cat_1',
          accountId: 'acc_2',
        })
      );
    });
  });

  it('switches transaction type to income when Income toggle is clicked', async () => {
    const user = userEvent.setup();
    onSubmitMock.mockResolvedValueOnce(undefined);

    render(
      <TransactionForm
          initialValues={mockAccounts as never}
        submitLabel={mockCategories as never}
        onSubmit={onSubmitMock}
        onCancel={onCloseMock}
      />
    );

    await user.click(screen.getByRole('button', { name: /^income$/i }));
    await user.type(screen.getByLabelText(/amount/i), '75000');
    await user.selectOptions(screen.getByLabelText(/category/i), 'cat_2');
    await user.selectOptions(screen.getByLabelText(/account/i), 'acc_2');

    await user.click(
      screen.getByRole('button', { name: /save|add transaction/i })
    );

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'income',
          amount: 75000,
          categoryId: 'cat_2',
        })
      );
    });
  });
});