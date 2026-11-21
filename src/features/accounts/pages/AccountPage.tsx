import { useState } from 'react';
import {
  IconAlertCircle,
  IconRefresh,
  IconSparkles,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useAccounts, type AccountFilterTab } from '../hooks/useAccounts';
import { TotalBalanceCard } from '../components/TotalBalanceCard';
import { AccountList } from '../components/AccountList';
import { AccountFormModal } from '../components/AccountForm';
import { TransferModal } from '../components/TransferModal';
import type {
  Account,
  AccountPayload,
  TransferPayload,
} from '../types/account.types';

function formatAccountsCurrency(amount: number, currency: string = 'INR'): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function AccountsPage() {
  const currency = 'INR';

  const {
    accounts,
    filteredAccounts,
    typeFilter,
    setTypeFilter,
    summary,
    isLoading,
    isMutating,
    error,
    refetch,
    createAccount,
    updateAccount,
    setDefaultAccount,
    transferFunds,
    deleteAccount,
  } = useAccounts();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceAccount, setTransferSourceAccount] =
    useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const filterTabs: { id: AccountFilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Accounts', count: accounts.length },
    {
      id: 'bank',
      label: 'Bank',
      count: accounts.filter((a) => a.type === 'bank').length,
    },
    {
      id: 'savings',
      label: 'Savings',
      count: accounts.filter((a) => a.type === 'savings').length,
    },
    {
      id: 'wallet',
      label: 'Wallets',
      count: accounts.filter((a) => a.type === 'wallet').length,
    },
    {
      id: 'cash',
      label: 'Cash',
      count: accounts.filter((a) => a.type === 'cash').length,
    },
    {
      id: 'credit_card',
      label: 'Credit Cards',
      count: accounts.filter((a) => a.type === 'credit_card').length,
    },
  ];

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (account: Account) => {
    setEditingAccount(account);
    setIsFormModalOpen(true);
  };

  const handleOpenTransfer = (sourceAccount?: Account) => {
    setTransferSourceAccount(sourceAccount ?? null);
    setIsTransferModalOpen(true);
  };

  const handleSaveAccount = async (payload: AccountPayload) => {
    if (editingAccount) {
      const updated = await updateAccount(editingAccount.id, payload);
      setBannerMessage(`Updated "${updated.name}".`);
    } else {
      const created = await createAccount(payload);
      setBannerMessage(`Added "${created.name}".`);
    }
    setEditingAccount(null);
  };

  const handleSetDefault = async (account: Account) => {
    await setDefaultAccount(account.id);
    setBannerMessage(`"${account.name}" is now your default account.`);
  };

  const handleTransferSubmit = async (payload: TransferPayload) => {
    const fromName =
      accounts.find((a) => a.id === payload.fromAccountId)?.name ?? 'Source';
    const toName =
      accounts.find((a) => a.id === payload.toAccountId)?.name ?? 'Destination';

    await transferFunds(payload);
    setBannerMessage(
      `Transferred ${formatAccountsCurrency(
        payload.amount,
        currency
      )} from "${fromName}" to "${toName}".`
    );
  };

  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    const removedName = deletingAccount.name;
    await deleteAccount(deletingAccount.id);
    setDeletingAccount(null);
    setBannerMessage(`Removed "${removedName}".`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
          Accounts & Wallets
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Monitor individual balances across bank accounts, cash, digital wallets, and credit cards
        </p>
      </div>

      {/* Feedback Banner */}
      {bannerMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-income/35 bg-income/10 px-4 py-3 text-xs font-semibold text-income">
          <span className="inline-flex items-center gap-2">
            <IconSparkles className="h-4 w-4 shrink-0" stroke={1.75} />
            {bannerMessage}
          </span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-ink-secondary hover:text-ink-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <Card className="flex flex-col items-start justify-between gap-3 border-expense/40 bg-expense/10 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5 text-sm text-expense">
            <IconAlertCircle className="h-5 w-5 shrink-0" stroke={1.75} />
            <span>{error}</span>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={refetch}>
            <IconRefresh className="h-4 w-4" stroke={1.75} />
            Retry
          </Button>
        </Card>
      )}

      {/* Combined Total Balance Hero Card */}
      <TotalBalanceCard
        summary={summary}
        currency={currency}
        isLoading={isLoading}
        onOpenTransfer={() => handleOpenTransfer()}
        onOpenCreate={handleOpenCreate}
      />

      {/* Account Type Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter accounts by type"
        className="flex flex-wrap items-center gap-2 border-b border-subtle pb-3"
      >
        {filterTabs.map((tab) => {
          const isActive = typeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTypeFilter(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-surface-elevated/45 text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-elevated text-ink-muted'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Individual Accounts Grid */}
      <AccountList
        accounts={filteredAccounts}
        totalAccountCount={accounts.length}
        typeFilter={typeFilter}
        currency={currency}
        isLoading={isLoading}
        isMutating={isMutating}
        onCreateNew={handleOpenCreate}
        onTransfer={handleOpenTransfer}
        onSetDefault={handleSetDefault}
        onEdit={handleOpenEdit}
        onDelete={(targetAccount) => setDeletingAccount(targetAccount)}
      />

      {/* Create / Edit Account Modal */}
      <AccountFormModal
        isOpen={isFormModalOpen}
        initialAccount={editingAccount}
        isSubmitting={isMutating}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingAccount(null);
        }}
        onSubmit={handleSaveAccount}
      />

      {/* Internal Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        accounts={accounts}
        initialFromAccount={transferSourceAccount}
        currency={currency}
        isSubmitting={isMutating}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferSourceAccount(null);
        }}
        onSubmit={handleTransferSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAccount)}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Account"
        message={
          deletingAccount
            ? `Are you sure you want to delete "${deletingAccount.name}"? Existing transactions will keep their history, but this account will be removed.`
            : ''
        }
        confirmText="Delete Account"
        isLoading={isMutating}
        variant="danger"
      />
    </div>
  );
}