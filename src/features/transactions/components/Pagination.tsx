import { useMemo, type ChangeEvent } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconDots,
} from '@tabler/icons-react';

import type { PageToken } from '../types/types';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  disabled?: boolean;
  className?: string;
}


function buildPageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens: PageToken[] = [1];
  const leftSibling = Math.max(2, currentPage - 1);
  const rightSibling = Math.min(totalPages - 1, currentPage + 1);

  if (leftSibling > 2) {
    tokens.push('ellipsis-left');
  }

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    tokens.push(page);
  }

  if (rightSibling < totalPages - 1) {
    tokens.push('ellipsis-right');
  }

  tokens.push(totalPages);
  return tokens;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = 'transactions',
  disabled = false,
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const pageTokens = useMemo(
    () => buildPageTokens(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  );

  // Hide pagination bar entirely when there are zero items or only 1 page (unless pageSize selector is active and items exceed smallest option)
  if (
    totalItems === 0 ||
    (totalPages <= 1 && (!onPageSizeChange || totalItems <= pageSizeOptions[0]))
  ) {
    return null;
  }

  const startItem = (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  const isFirstPage = safeCurrentPage <= 1;
  const isLastPage = safeCurrentPage >= totalPages;

  const handlePageSizeSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    if (!onPageSizeChange || disabled) return;
    const nextSize = Number(e.target.value);
    onPageSizeChange(nextSize);
  };

  return (
    <nav
      aria-label="Transactions pagination"
      className={`flex flex-col items-center justify-between gap-4 rounded-2xl border border-subtle bg-surface px-4 py-3.5 sm:flex-row sm:px-6 ${className}`}
    >
      {/* Left: Range Summary + Optional Page Size Selector */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-ink-secondary sm:justify-start">
        <span>
          Showing{' '}
          <strong className="font-semibold text-ink-primary">{startItem}</strong>
          –
          <strong className="font-semibold text-ink-primary">{endItem}</strong>{' '}
          of{' '}
          <strong className="font-semibold text-ink-primary">
            {totalItems}
          </strong>{' '}
          {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-2 border-l border-subtle pl-3">
            <label
              htmlFor="pagination-page-size"
              className="text-ink-muted whitespace-nowrap"
            >
              Per page:
            </label>
            <select
              id="pagination-page-size"
              value={pageSize}
              onChange={handlePageSizeSelect}
              disabled={disabled}
              className="h-8 rounded-lg border border-subtle bg-surface-elevated px-2 text-xs font-medium text-ink-primary transition-colors focus:border-brand focus:ring-2 focus:ring-brand/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Previous + Page Number Buttons + Next */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={disabled || isFirstPage}
            aria-label="Go to previous page"
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-subtle bg-surface-elevated/60 px-3 text-xs font-medium text-ink-secondary transition-colors hover:border-ink-muted/50 hover:bg-surface-elevated hover:text-ink-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconChevronLeft className="h-4 w-4" stroke={1.75} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Compact Mobile Page Indicator */}
          <span className="px-2 text-xs font-medium text-ink-secondary sm:hidden">
            Page <strong className="text-ink-primary">{safeCurrentPage}</strong> of{' '}
            {totalPages}
          </span>

          {/* Desktop / Tablet Numbered Page Buttons */}
          <div className="hidden items-center gap-1 sm:flex">
            {pageTokens.map((token) => {
              if (token === 'ellipsis-left' || token === 'ellipsis-right') {
                return (
                  <span
                    key={token}
                    aria-hidden="true"
                    className="flex h-10 w-9 items-center justify-center text-ink-muted"
                  >
                    <IconDots className="h-4 w-4" stroke={1.75} />
                  </span>
                );
              }

              const isActive = token === safeCurrentPage;

              return (
                <button
                  key={token}
                  type="button"
                  onClick={() => onPageChange(token)}
                  disabled={disabled}
                  aria-label={`Page ${token}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isActive
                      ? 'bg-brand text-canvas shadow-sm'
                      : 'border border-transparent text-ink-secondary hover:border-subtle hover:bg-surface-elevated hover:text-ink-primary'
                  }`}
                >
                  {token}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={disabled || isLastPage}
            aria-label="Go to next page"
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-subtle bg-surface-elevated/60 px-3 text-xs font-medium text-ink-secondary transition-colors hover:border-ink-muted/50 hover:bg-surface-elevated hover:text-ink-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">Next</span>
            <IconChevronRight className="h-4 w-4" stroke={1.75} />
          </button>
        </div>
      )}
    </nav>
  );
}