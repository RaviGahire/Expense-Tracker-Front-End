import { useState } from "react";
import { IconPlus, IconArrowUpRight, IconArrowDownRight, IconScale } from "@tabler/icons-react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useTransactions } from "../hooks/useTransactions";
import { TransactionFilters } from "../components/TransactionFilters";
import { TransactionList } from "../components/TransactionList";
import { formatTransactionCurrency, type TransactionRecord } from "../components/TransactionItem";
import { Pagination } from "../components/Pagination";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { TransactionModal } from "../components/TransactionModal";
import type { TransactionFormValues } from "../components/TransactionForm";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

export function TransactionsPage() {
    const { user } = useAuth();
    const currency = user?.currency || "INR";

    const {
        transactions,
        filteredTransactions,
        paginatedTransactions,
        filters,
        setFilters,
        resetFilters,
        hasActiveFilters,
        totals,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        isLoading,
        isMutating,
        error,
        refetch,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    } = useTransactions(10);

    // Modal & ConfirmDialog state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<TransactionRecord | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleOpenCreateModal = () => {
        setEditingTransaction(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (transaction: TransactionRecord) => {
        setEditingTransaction(transaction);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        if (isMutating) return;
        setIsFormModalOpen(false);
        setEditingTransaction(null);
    };

    const handleFormSubmit = async (values: TransactionFormValues) => {
        if (editingTransaction) {
            await updateTransaction(editingTransaction.id, values);
        } else {
            await createTransaction(values);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingTransaction) return;
        await deleteTransaction(deletingTransaction.id);
        setDeletingTransaction(null);
    };

    const handleRetry = async () => {
        try {
            setIsRetrying(true);
            await refetch();
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <section className="space-y-6">
            {/* Top Page Header & Primary Actions */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
                        Transactions
                    </h1>
                    <p className="mt-1 text-sm text-ink-secondary">
                        Search, filter, export, and manage all your recorded income and expenses.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <ExportCsvButton
                        transactions={filteredTransactions}
                        currency={currency}
                        filenamePrefix={
                            hasActiveFilters ? "filtered-transactions" : "all-transactions"
                        }
                        disabled={isLoading}
                    />

                    <Button
                        type="button"
                        onClick={handleOpenCreateModal}
                        leftIcon={<IconPlus className="h-4 w-4" stroke={2.25} />}
                    >
                        Add Transaction
                    </Button>
                </div>
            </div>

            {/* Error State vs. Active Page Workspace */}
            {error ? (
                <ErrorState
                    title="Unable to load transactions"
                    message={error}
                    onRetry={handleRetry}
                    isRetrying={isRetrying}
                />
            ) : (
                <>
                    {/* Live Filtered Cashflow Summary Strip */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Card className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-ink-secondary">
                                    Filtered Income
                                </p>
                                <p className="mt-1 text-xl font-bold tracking-tight text-income">
                                    +{formatTransactionCurrency(totals.income, currency)}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-income/15 text-income">
                                <IconArrowUpRight className="h-5 w-5" stroke={1.75} />
                            </div>
                        </Card>

                        <Card className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-ink-secondary">
                                    Filtered Expenses
                                </p>
                                <p className="mt-1 text-xl font-bold tracking-tight text-expense">
                                    -{formatTransactionCurrency(totals.expense, currency)}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-expense/15 text-expense">
                                <IconArrowDownRight className="h-5 w-5" stroke={1.75} />
                            </div>
                        </Card>

                        <Card className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-ink-secondary">
                                    Net Balance
                                </p>
                                <p
                                    className={`mt-1 text-xl font-bold tracking-tight ${
                                        totals.net >= 0 ? "text-ink-primary" : "text-expense"
                                    }`}
                                >
                                    {totals.net >= 0 ? "+" : "-"}
                                    {formatTransactionCurrency(Math.abs(totals.net), currency)}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                                <IconScale className="h-5 w-5" stroke={1.75} />
                            </div>
                        </Card>
                    </div>

                    {/* Search, Filter & Sort Controls */}
                    <TransactionFilters
                        filters={filters}
                        onChange={setFilters}
                        onReset={resetFilters}
                        totalCount={transactions.length}
                        filteredCount={filteredTransactions.length}
                        disabled={isLoading}
                    />

                    {/* Responsive Table / Mobile Card List */}
                    <TransactionList
                        transactions={paginatedTransactions}
                        currency={currency}
                        isLoading={isLoading}
                        hasActiveFilters={hasActiveFilters}
                        onEdit={handleOpenEditModal}
                        onDelete={setDeletingTransaction}
                        onAddTransaction={handleOpenCreateModal}
                        onResetFilters={resetFilters}
                    />

                    {/* Pagination Controls */}
                    {!isLoading && (
                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredTransactions.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                        />
                    )}
                </>
            )}

            {/* Add / Edit Transaction Modal */}
            <TransactionModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                onSubmit={handleFormSubmit}
                transaction={editingTransaction}
                isSubmitting={isMutating}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={Boolean(deletingTransaction)}
                onClose={() => {
                    if (!isMutating) setDeletingTransaction(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Transaction"
                message={
                    deletingTransaction
                        ? `Are you sure you want to permanently delete "${
                              deletingTransaction.title
                          }" (${formatTransactionCurrency(
                              deletingTransaction.amount,
                              currency
                          )})? This action cannot be undone.`
                        : "Are you sure you want to delete this transaction?"
                }
                // confirmLabel="Delete Transaction"
                variant="danger"
                isLoading={isMutating}
            />
        </section>
    );
}
