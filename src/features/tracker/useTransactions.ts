import { useEffect, useMemo, useState } from 'react';
import type {
  CreateTransaction,
  Transaction,
  TransactionTotals,
} from './tracker.types';

const STORAGE_KEY = 'money-transactions';

function getStoredTransactions(): Transaction[] {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? (parsedValue as Transaction[]) : [];
  } catch {
    return [];
  }
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(
    getStoredTransactions,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const totals = useMemo<TransactionTotals>(() => {
    const result = transactions.reduce(
      (currentTotals, transaction) => {
        if (transaction.type === 'income') {
          currentTotals.income += transaction.amount;
        } else {
          currentTotals.expenses += transaction.amount;
        }

        return currentTotals;
      },
      {
        income: 0,
        expenses: 0,
      },
    );

    return {
      ...result,
      balance: result.income - result.expenses,
    };
  }, [transactions]);

  const addTransaction = (data: CreateTransaction) => {
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      description: data.description.trim(),
      amount: data.amount,
      type: data.type,
      createdAt: new Date().toISOString(),
    };

    setTransactions((currentTransactions) => [
      newTransaction,
      ...currentTransactions,
    ]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((currentTransactions) =>
      currentTransactions.filter((transaction) => transaction.id !== id),
    );
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  return {
    transactions,
    totals,
    addTransaction,
    deleteTransaction,
    clearTransactions,
  };
}