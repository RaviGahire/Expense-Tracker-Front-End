export type PageToken = number | 'ellipsis-left' | 'ellipsis-right';

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';


  export type FilterTransactionType = "all" | "income" | "expense";

export type TransactionSortBy = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";