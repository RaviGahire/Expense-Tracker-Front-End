import { useState, useEffect, type FormEvent } from 'react';
import {
  IconBuildingBank,
  IconPigMoney,
  IconWallet,
  IconCash,
  IconCreditCard,
  IconBuildingStore,
  IconCoins,
  IconDeviceMobile,
} from '@tabler/icons-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { SelectInput } from '../../../components/ui/SelectInput';
import { Button } from '../../../components/ui/Button';
import {
  CategoryIcon,
  type CategoryColorToken,
} from '../../categories/components/CategoryIcon';
import { accountSchema } from '../schemas/accountSchema';
import { getDefaultIconForAccountType } from '../services/accountService';
import type {
  Account,
  AccountPayload,
  AccountType,
} from '../types/account.types';

export interface AccountFormModalProps {
  isOpen: boolean;
  initialAccount?: Account | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: AccountPayload) => Promise<void>;
}

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'wallet', label: 'Digital Wallet / UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
];

const COLOR_OPTIONS: {
  value: CategoryColorToken;
  label: string;
  swatchClass: string;
}[] = [
  { value: 'brand', label: 'Brand', swatchClass: 'bg-brand' },
  { value: 'income', label: 'Emerald', swatchClass: 'bg-income' },
  { value: 'warning', label: 'Amber', swatchClass: 'bg-warning' },
  { value: 'expense', label: 'Coral', swatchClass: 'bg-expense' },
  { value: 'neutral', label: 'Slate', swatchClass: 'bg-ink-secondary' },
];

const ACCOUNT_ICON_CHOICES = [
  { name: 'IconBuildingBank', label: 'Bank', icon: IconBuildingBank },
  { name: 'IconPigMoney', label: 'Savings', icon: IconPigMoney },
  { name: 'IconWallet', label: 'Wallet', icon: IconWallet },
  { name: 'IconCash', label: 'Cash', icon: IconCash },
  { name: 'IconCreditCard', label: 'Credit Card', icon: IconCreditCard },
  { name: 'IconDeviceMobile', label: 'UPI / Mobile', icon: IconDeviceMobile },
  { name: 'IconCoins', label: 'Reserve', icon: IconCoins },
  { name: 'IconBuildingStore', label: 'Business', icon: IconBuildingStore },
];

interface FormErrors {
  name?: string;
  balance?: string;
  creditLimit?: string;
  institution?: string;
  accountNumberLast4?: string;
  notes?: string;
}

export function AccountFormModal({
  isOpen,
  initialAccount = null,
  isSubmitting = false,
  onClose,
  onSubmit,
}: AccountFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('0');
  const [creditLimit, setCreditLimit] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountNumberLast4, setAccountNumberLast4] = useState('');
  const [color, setColor] = useState<CategoryColorToken>('brand');
  const [iconName, setIconName] = useState<string>('IconBuildingBank');
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const isEditMode = Boolean(initialAccount);
  const isCreditCard = type === 'credit_card';

  useEffect(() => {
    if (!isOpen) return;

    if (initialAccount) {
      setName(initialAccount.name);
      setType(initialAccount.type);
      setBalance(String(initialAccount.balance));
      setCreditLimit(
        initialAccount.creditLimit !== undefined
          ? String(initialAccount.creditLimit)
          : ''
      );
      setInstitution(initialAccount.institution ?? '');
      setAccountNumberLast4(initialAccount.accountNumberLast4 ?? '');
      setColor(initialAccount.color);
      setIconName(
        initialAccount.iconName ??
          getDefaultIconForAccountType(initialAccount.type)
      );
      setIsDefault(Boolean(initialAccount.isDefault));
      setNotes(initialAccount.notes ?? '');
    } else {
      setName('');
      setType('bank');
      setBalance('0');
      setCreditLimit('');
      setInstitution('');
      setAccountNumberLast4('');
      setColor('brand');
      setIconName('IconBuildingBank');
      setIsDefault(false);
      setNotes('');
    }
    setErrors({});
  }, [isOpen, initialAccount]);

  const handleTypeChange = (nextType: AccountType) => {
    setType(nextType);
    if (!isEditMode) {
      setIconName(getDefaultIconForAccountType(nextType));
      if (nextType === 'credit_card') setColor('expense');
      else if (nextType === 'savings') setColor('income');
      else if (nextType === 'wallet') setColor('warning');
      else if (nextType === 'cash') setColor('neutral');
      else setColor('brand');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = accountSchema.safeParse({
      name,
      type,
      balance: balance === '' ? Number.NaN : Number(balance),
      creditLimit:
        isCreditCard && creditLimit.trim() !== ''
          ? Number(creditLimit)
          : undefined,
      institution: institution.trim() || undefined,
      accountNumberLast4: accountNumberLast4.trim() || undefined,
      color,
      iconName,
      isDefault,
      notes: notes.trim() || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors | undefined;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    await onSubmit(parsed.data);
    onClose();
  };

  const typeLabel =
    ACCOUNT_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ??
    'Account';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Account' : 'Add Account or Wallet'}
      description={
        isEditMode
          ? 'Update account details, current balance, or default status.'
          : 'Track a bank account, cash wallet, UPI app, savings account, or credit card.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Live Preview Banner */}
        <div className="flex items-center gap-3 rounded-xl border border-subtle bg-surface-elevated/45 p-3">
          <CategoryIcon
            name={iconName}
            label={name || typeLabel}
            type={isCreditCard ? 'expense' : 'income'}
            color={color}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink-primary">
              {name.trim() || `New ${typeLabel}`}
            </p>
            <p className="truncate text-xs text-ink-secondary">
              {typeLabel}
              {institution.trim() ? ` • ${institution.trim()}` : ''}
              {accountNumberLast4.trim()
                ? ` • •••• ${accountNumberLast4.trim()}`
                : ''}
            </p>
          </div>
        </div>

        {/* Account Name & Type */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Input
            label="Account Name"
            placeholder="e.g., HDFC Salary Account"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />

          <SelectInput
            label="Account Type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as AccountType)}
            options={ACCOUNT_TYPE_OPTIONS}
          />
        </div>

        {/* Balance & Credit Limit (or Last 4 Digits) */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Input
            label={
              isCreditCard ? 'Current Statement Owed' : 'Current Balance'
            }
            type="number"
            step="any"
            placeholder="0"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            error={errors.balance}
            required
          />

          {isCreditCard ? (
            <Input
              label="Credit Limit (Optional)"
              type="number"
              min="0"
              step="any"
              placeholder="150000"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              error={errors.creditLimit}
            />
          ) : (
            <Input
              label="Last 4 Digits (Optional)"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="4821"
              value={accountNumberLast4}
              onChange={(e) =>
                setAccountNumberLast4(e.target.value.replace(/\D/g, ''))
              }
              error={errors.accountNumberLast4}
            />
          )}
        </div>

        {/* Institution & Badge Color */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Input
            label="Bank / Provider (Optional)"
            placeholder="e.g., HDFC Bank, PhonePe, Cash"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            error={errors.institution}
          />

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Badge Color
            </span>
            <div className="flex h-10 items-center gap-2.5 rounded-xl border border-subtle bg-surface-elevated/40 px-3">
              {COLOR_OPTIONS.map((option) => {
                const isSelected = color === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColor(option.value)}
                    title={option.label}
                    aria-label={option.label}
                    className={`h-6 w-6 rounded-full transition-transform ${
                      option.swatchClass
                    } ${
                      isSelected
                        ? 'scale-110 ring-2 ring-ink-primary ring-offset-2 ring-offset-surface'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Account Icon Picker */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-secondary">
            Account Icon
          </span>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {ACCOUNT_ICON_CHOICES.map((choice) => {
              const IconComp = choice.icon;
              const isSelected = iconName === choice.name;
              return (
                <button
                  key={choice.name}
                  type="button"
                  onClick={() => setIconName(choice.name)}
                  title={choice.label}
                  aria-label={choice.label}
                  className={`flex h-10 items-center justify-center rounded-xl border transition-colors ${
                    isSelected
                      ? 'border-brand bg-brand/15 text-brand'
                      : 'border-subtle bg-surface-elevated/40 text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  <IconComp className="h-4.5 w-4.5" stroke={1.75} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes & Default Toggle */}
        <Input
          label="Notes (Optional)"
          placeholder="e.g., Primary salary account or auto-debit bills..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={errors.notes}
        />

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-subtle/80 bg-surface-elevated/35 px-3.5 py-2.5">
          <div>
            <p className="text-xs font-semibold text-ink-primary">
              Set as default account
            </p>
            <p className="text-[11px] text-ink-muted">
              Auto-selected whenever you record a new transaction
            </p>
          </div>
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded border-subtle accent-brand"
          />
        </label>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-subtle pt-3.5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : isEditMode
              ? 'Save Changes'
              : 'Add Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}