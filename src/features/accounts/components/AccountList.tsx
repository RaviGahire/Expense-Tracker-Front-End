import { IconPlus, IconWallet } from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { AccountCard } from './AccountCard';
import type { AccountFilterTab } from '../hooks/useAccounts';
import type { Account, AccountType } from '../types/account.types';

export interface AccountListProps {
  accounts: Account[];
  totalAccountCount: number;
  typeFilter: AccountFilterTab;
  currency?: string;
  isLoading?: boolean;
  isMutating?: boolean;
  onCreateNew: () => void;
  onTransfer: (account: Account) => void;
  onSetDefault: (account: Account) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const FILTER_EMPTY_LABELS: Record<AccountType, string> = {
  bank: 'bank accounts',
  savings: 'savings accounts',
  wallet: 'digital wallets',
  cash: 'cash accounts',
  credit_card: 'credit cards',
};

export function AccountList({
  accounts,
  totalAccountCount,
  typeFilter,
  currency = 'INR',
  isLoading = false,
  isMutating = false,
  onCreateNew,
  onTransfer,
  onSetDefault,
  onEdit,
  onDelete,
}: AccountListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Card
            key={item}
            className="h-60 animate-pulse bg-surface-elevated/40"
          >
            <div className="h-5 w-40 rounded bg-surface-elevated" />
            <div className="mt-4 h-20 rounded-xl bg-surface-elevated" />
            <div className="mt-4 h-4 w-24 rounded bg-surface-elevated" />
          </Card>
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-brand">
          <IconWallet className="h-6 w-6" stroke={1.75} />
        </div>
        <h2 className="mt-4 text-base font-bold text-ink-primary">
          {typeFilter === 'all'
            ? 'No accounts or wallets yet'
            : `No ${FILTER_EMPTY_LABELS[typeFilter]} added`}
        </h2>
        <p className="mt-1 max-w-md text-xs text-ink-secondary">
          {typeFilter === 'all'
            ? 'Add your bank accounts, cash wallet, UPI apps, or credit cards to track individual balances and link transactions.'
            : 'Switch filter tabs or add a new account to track its balance.'}
        </p>
        <div className="mt-5">
          <Button type="button" variant="primary" onClick={onCreateNew}>
            <IconPlus className="h-4 w-4" stroke={2} />
            Add Account
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          currency={currency}
          canTransfer={totalAccountCount >= 2}
          isMutating={isMutating}
          onTransfer={onTransfer}
          onSetDefault={onSetDefault}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}