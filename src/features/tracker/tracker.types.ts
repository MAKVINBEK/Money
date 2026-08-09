export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  createdAt: string;
}

export interface CreateTransaction {
  description: string;
  amount: number;
  type: TransactionType;
}

export interface TransactionTotals {
  income: number;
  expenses: number;
  balance: number;
}