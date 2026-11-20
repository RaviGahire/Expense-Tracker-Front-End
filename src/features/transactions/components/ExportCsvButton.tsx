import { useState, useEffect } from 'react';
import { IconDownload, IconCheck } from '@tabler/icons-react';
import { Button } from '../../../components/ui/Button';
import type { TransactionRecord } from './TransactionItem';

export interface ExportCsvButtonProps {
  transactions: TransactionRecord[];
  currency?: string;
  filenamePrefix?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

function escapeCsvCell(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

export function buildTransactionsCsv(
  transactions: TransactionRecord[],
  currency: string = 'INR'
): string {
  const headers = [
    'ID',
    'Date',
    'Title',
    'Type',
    'Category',
    'Payment Method',
    `Amount (${currency})`,
    'Signed Amount',
    'Recurring',
    'Frequency',
    'Next Scheduled Date',
    'Notes',
    'Receipt URL',
  ];

  const rows = transactions.map((tx) => {
    const signedAmount =
      tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount);

    return [
      escapeCsvCell(tx.id),
      escapeCsvCell(tx.date),
      escapeCsvCell(tx.title),
      escapeCsvCell(tx.type === 'income' ? 'Income' : 'Expense'),
      escapeCsvCell(tx.category),
      escapeCsvCell(tx.paymentMethod),
      escapeCsvCell(Math.abs(tx.amount)),
      escapeCsvCell(signedAmount),
      escapeCsvCell(tx.recurring?.isRecurring ? 'Yes' : 'No'),
      escapeCsvCell(tx.recurring?.isRecurring ? tx.recurring.frequency : ''),
      escapeCsvCell(tx.recurring?.isRecurring ? tx.recurring.nextDate : ''),
      escapeCsvCell(tx.notes ?? ''),
      escapeCsvCell(tx.existingAttachment?.url ?? ''),
    ].join(',');
  });

  // Prepend UTF-8 BOM so Microsoft Excel renders currency & UTF-8 text properly
  return `\uFEFF${[headers.map(escapeCsvCell).join(','), ...rows].join('\r\n')}`;
}

function buildExportFilename(prefix: string): string {
  const dateStamp = new Date().toISOString().split('T')[0];
  const sanitizedPrefix = prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-');
  return `${sanitizedPrefix || 'transactions'}-${dateStamp}.csv`;
}

export function ExportCsvButton({
  transactions,
  currency = 'INR',
  filenamePrefix = 'transactions',
  label = 'Export CSV',
  size = 'md',
  disabled = false,
  className = '',
}: ExportCsvButtonProps) {
  const [isExported, setIsExported] = useState(false);

  useEffect(() => {
    if (!isExported) return;
    const timer = window.setTimeout(() => {
      setIsExported(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [isExported]);

  const isEmpty = transactions.length === 0;

  const handleExport = () => {
    if (disabled || isEmpty) return;

    const csvContent = buildTransactionsCsv(transactions, currency);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.setAttribute('download', buildExportFilename(filenamePrefix));
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(downloadUrl);
    setIsExported(true);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleExport}
      disabled={disabled || isEmpty}
      title={
        isEmpty
          ? 'No transactions available to export'
          : `Export ${transactions.length} transaction${
              transactions.length === 1 ? '' : 's'
            } to CSV`
      }
      leftIcon={
        isExported ? (
          <IconCheck className="h-4 w-4 text-income" stroke={2} />
        ) : (
          <IconDownload className="h-4 w-4" stroke={1.75} />
        )
      }
      className={className}
    >
      {isExported ? 'Exported' : label}
    </Button>
  );
}