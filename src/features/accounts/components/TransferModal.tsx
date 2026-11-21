import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { IconArrowsLeftRight, IconArrowRight } from '@tabler/icons-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { SelectInput } from '../../../components/ui/SelectInput';
import { Button } from '../../../components/ui/Button';
import { transferSchema } from '../schemas/accountSchema';
import { getTodayAccountDate } from '../services/accountService';
import type { Account, TransferPayload } from '../types/account.types';

export interface TransferModalProps {
  isOpen: boolean;
  accounts: Account[];
  initialFromAccount?: Account | null;
  currency?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: TransferPayload) => Promise<void>;
}

const QUICK_TRANSFER_PRESETS = [1000, 2500, 5000, 10000];

function formatTransferCurrency(amount: number, currency: string = 'INR'): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface TransferErrors {
  fromAccountId?: string;
  toAccountId?: string;
  amount?: string;
  date?: string;
  note?: string;
}

export function TransferModal({
  isOpen,
  accounts,
  initialFromAccount = null,
  currency = 'INR',
  isSubmitting = false,
  onClose,
  onSubmit,
}: TransferModalProps) {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayAccountDate());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<TransferErrors>({});

  useEffect(() => {
    if (!isOpen || accounts.length === 0) return;

    const defaultSource =
      initialFromAccount ??
      accounts.find((acc) => acc.isDefault) ??
      accounts[0];
    const defaultDestination =
      accounts.find((acc) => acc.id !== defaultSource.id) ?? accounts[0];

    setFromAccountId(defaultSource.id);
    setToAccountId(defaultDestination.id);
    setAmount('');
    setDate(getTodayAccountDate());
    setNote('');
    setErrors({});
  }, [isOpen, accounts, initialFromAccount]);

  const accountOptions = useMemo(
    () =>
      accounts.map((acc) => ({
        value: acc.id,
        label: `${acc.name} (${formatTransferCurrency(acc.balance, currency)})`,
      })),
    [accounts, currency]
  );

  const sourceAccount = useMemo(
    () => accounts.find((acc) => acc.id === fromAccountId) ?? null,
    [accounts, fromAccountId]
  );

  const destinationAccount = useMemo(
    () => accounts.find((acc) => acc.id === toAccountId) ?? null,
    [accounts, toAccountId]
  );

  const handleSwapAccounts = () => {
    setFromAccountId(toAccountId);
    setToAccountId(fromAccountId);
    setErrors((prev) => ({
      ...prev,
      fromAccountId: undefined,
      toAccountId: undefined,
    }));
  };

  const handlePresetAdd = (preset: number) => {
    const currentVal = Number(amount);
    const base = !Number.isNaN(currentVal) && currentVal > 0 ? currentVal : 0;
    setAmount(String(base + preset));
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = transferSchema.safeParse({
      fromAccountId,
      toAccountId,
      amount: amount === '' ? Number.NaN : Number(amount),
      date,
      note: note.trim() || undefined,
    });

    if (!parsed.success) {
      const nextErrors: TransferErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof TransferErrors | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    await onSubmit(parsed.data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Between Accounts"
      description="Move money between your bank accounts, wallets, cash, or savings."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Visual Source -> Destination Preview */}
        {sourceAccount && destinationAccount && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-subtle bg-surface-elevated/45 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-wide text-ink-muted uppercase">
                From
              </p>
              <p className="truncate text-xs font-bold text-ink-primary">
                {sourceAccount.name}
              </p>
              <p className="text-[11px] text-ink-secondary">
                {formatTransferCurrency(sourceAccount.balance, currency)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSwapAccounts}
              title="Swap source and destination accounts"
              aria-label="Swap source and destination accounts"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-subtle bg-surface text-brand transition-colors hover:bg-brand/10"
            >
              <IconArrowRight className="h-4 w-4" stroke={2} />
            </button>

            <div className="min-w-0 flex-1 text-right">
              <p className="text-[10px] font-semibold tracking-wide text-ink-muted uppercase">
                To
              </p>
              <p className="truncate text-xs font-bold text-ink-primary">
                {destinationAccount.name}
              </p>
              <p className="text-[11px] text-ink-secondary">
                {formatTransferCurrency(destinationAccount.balance, currency)}
              </p>
            </div>
          </div>
        )}

        {/* From & To Selectors */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <SelectInput
            label="From Account"
            value={fromAccountId}
            onChange={(e:any) => setFromAccountId(e.target.value)}
            options={accountOptions}
            error={errors.fromAccountId}
          />

          <SelectInput
            label="To Account"
            value={toAccountId}
            onChange={(e:any) => setToAccountId(e.target.value)}
            options={accountOptions}
            error={errors.toAccountId}
          />
        </div>

        {/* Amount & Quick Chips */}
        <div className="space-y-2">
          <Input
            label="Transfer Amount"
            type="number"
            min="0.01"
            step="any"
            placeholder="5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            required
          />

          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_TRANSFER_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetAdd(preset)}
                className="rounded-lg border border-subtle bg-surface-elevated/50 px-2.5 py-1 text-xs font-semibold text-ink-secondary transition-colors hover:border-brand/40 hover:text-brand"
              >
                +{formatTransferCurrency(preset, currency)}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Optional Note */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Input
            label="Transfer Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
            required
          />

          <Input
            label="Note (Optional)"
            placeholder="e.g., Monthly savings top-up"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            error={errors.note}
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-subtle pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            <IconArrowsLeftRight className="h-4 w-4" stroke={1.75} />
            {isSubmitting ? 'Transferring...' : 'Transfer Funds'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}