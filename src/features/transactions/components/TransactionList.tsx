import {
  IconReceipt,
  IconPlus,
  IconFilterOff,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/feedback/EmptyState';
import {
  TransactionItem,
  type TransactionRecord,
} from './TransactionItem';

export type { TransactionRecord };

export interface TransactionListProps {
  transactions: TransactionRecord[];
  currency?: string;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  onEdit: (transaction: TransactionRecord) => void;
  onDelete: (transaction: TransactionRecord) => void;
  onAddTransaction?: () => void;
  onResetFilters?: () => void;
}

export function TransactionList({
  transactions,
  currency = 'INR',
  isLoading = false,
  hasActiveFilters = false,
  onEdit,
  onDelete,
  onAddTransaction,
  onResetFilters,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden p-0">
        <div className="divide-y divide-subtle">
          {[1, 2, 3, 4, 5, 6].map((skeleton) => (
            <div
              key={skeleton}
              className="flex animate-pulse items-center justify-between gap-4 p-4 sm:px-6"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-surface-elevated" />
                <div className="space-y-2">
                  <div className="h-4 w-36 rounded bg-surface-elevated" />
                  <div className="h-3 w-24 rounded bg-surface-elevated" />
                </div>
              </div>
              <div className="hidden gap-3 md:flex">
                <div className="h-6 w-24 rounded-full bg-surface-elevated" />
                <div className="h-6 w-20 rounded-full bg-surface-elevated" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 rounded bg-surface-elevated" />
                <div className="h-9 w-16 rounded-lg bg-surface-elevated" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={<IconFilterOff className="h-6 w-6" stroke={1.75} />}
          title="No matching transactions"
          description="No transactions match your current search or filter criteria. Try adjusting or clearing your filters."
          actionLabel={onResetFilters ? 'Reset Filters' : undefined}
          onAction={onResetFilters}
        />
      );
    }

    return (
      <EmptyState
        icon={<IconReceipt className="h-6 w-6" stroke={1.75} />}
        title="No transactions recorded yet"
        description="Start logging your income and expenses to build your complete transaction history."
        actionLabel={onAddTransaction ? 'Add First Transaction' : undefined}
        actionIcon={<IconPlus className="h-4 w-4" stroke={2} />}
        onAction={onAddTransaction}
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      {/* Desktop Table View (md and up) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-subtle bg-surface-elevated/50 text-xs font-semibold tracking-wider text-ink-secondary uppercase">
              <th className="px-6 py-3.5">Transaction</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Method</th>
              <th className="px-4 py-3.5 text-right">Amount</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-subtle text-sm">
            {transactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                currency={currency}
                variant="table-row"
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card Rows (below md) */}
      <div className="divide-y divide-subtle md:hidden">
        {transactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            currency={currency}
            variant="mobile-card"
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </Card>
  );
}