export type TransactionType = 'income' | 'expense';

export type ExpenseCategoryId =
  | 'groceries'
  | 'transport'
  | 'home'
  | 'cafe'
  | 'shopping'
  | 'health'
  | 'subscriptions'
  | 'entertainment'
  | 'transfers'
  | 'other';

export type IncomeCategoryId =
  | 'salary'
  | 'side-income'
  | 'gift'
  | 'refund'
  | 'transfer'
  | 'other';

export type CategoryId = ExpenseCategoryId | IncomeCategoryId;

export type ThemePreference = 'system' | 'light' | 'dark';

export type CurrencyCode = 'KGS' | 'RUB' | 'USD';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: CategoryId;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionInput {
  description: string;
  amount: number;
  type: TransactionType;
  category: CategoryId;
  createdAt: string;
}

export interface AppSettings {
  theme: ThemePreference;
  currency: CurrencyCode;
  budget: number;
  firstDay: number;
  balanceHidden: boolean;
}

export interface TransactionTotals {
  income: number;
  expenses: number;
  balance: number;
}

export interface DateRange {
  /** Inclusive local-time boundary. */
  start: Date;
  /** Exclusive local-time boundary. */
  end: Date;
}

export interface CategoryShare {
  category: CategoryId;
  amount: number;
  percentage: number;
}

export interface ExpenseComparison {
  current: number;
  previous: number;
  difference: number;
  /** Null means that a percentage cannot be calculated from a zero baseline. */
  percentageChange: number | null;
}

export interface ExpenseAnalytics {
  totals: TransactionTotals;
  categoryShares: CategoryShare[];
  averagePerDay: number;
  topCategory: CategoryShare | null;
  comparison: ExpenseComparison;
}

export interface BackupData {
  version: number;
  transactions: Transaction[];
  settings: AppSettings;
  createdAt: string;
}
