import { isCategoryForType } from '../data/categories';
import type {
  CategoryId,
  CategoryShare,
  DateRange,
  ExpenseAnalytics,
  ExpenseComparison,
  Transaction,
  TransactionTotals,
} from '../types/finance';
import {
  countCalendarDays,
  countElapsedDays,
  getBillingPeriodForMonth,
  getDayRange,
  getPreviousBillingPeriod,
  isDateInRange,
  parseDate,
} from './date';

const MINOR_UNIT_FACTOR = 100;
const DECIMAL_AMOUNT_PATTERN = /^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/;

const toMinorUnits = (value: number): number | null => {
  const scaledValue = value * MINOR_UNIT_FACTOR;
  const result = Math.round(
    scaledValue + Number.EPSILON * Math.abs(scaledValue),
  );
  return Number.isSafeInteger(result) ? result : null;
};

const fromMinorUnits = (value: number): number => value / MINOR_UNIT_FACTOR;

export function roundMoney(value: number): number {
  const minorUnits = toMinorUnits(value);
  return minorUnits === null ? 0 : fromMinorUnits(minorUnits);
}

export function normalizePositiveAmount(value: unknown): number | null {
  if (typeof value === 'string') {
    const normalizedValue = value.trim();

    if (!DECIMAL_AMOUNT_PATTERN.test(normalizedValue)) {
      return null;
    }

    const [integerPart = '0', fractionPart = ''] = normalizedValue
      .replace(',', '.')
      .split('.');
    const wholeUnits = Number(integerPart || '0');
    const minorUnits =
      wholeUnits * MINOR_UNIT_FACTOR +
      Number(fractionPart.padEnd(2, '0') || '0');

    return Number.isSafeInteger(minorUnits) && minorUnits > 0
      ? fromMinorUnits(minorUnits)
      : null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  const minorUnits = toMinorUnits(value);
  return minorUnits !== null && minorUnits > 0 ? fromMinorUnits(minorUnits) : null;
}

const getTransactionMinorUnits = (transaction: Transaction): number | null => {
  if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) {
    return null;
  }

  return toMinorUnits(transaction.amount);
};

export function filterTransactionsByPeriod(
  transactions: readonly Transaction[],
  period: DateRange,
): Transaction[] {
  return transactions.filter((transaction) => isDateInRange(transaction.createdAt, period));
}

export function calculateAllTimeTotals(
  transactions: readonly Transaction[],
): TransactionTotals {
  let income = 0;
  let expenses = 0;

  for (const transaction of transactions) {
    const amount = getTransactionMinorUnits(transaction);

    if (amount === null) {
      continue;
    }

    if (transaction.type === 'income') {
      income += amount;
    } else if (transaction.type === 'expense') {
      expenses += amount;
    }
  }

  return {
    income: fromMinorUnits(income),
    expenses: fromMinorUnits(expenses),
    balance: fromMinorUnits(income - expenses),
  };
}

export const calculateTotals = calculateAllTimeTotals;

export function calculatePeriodTotals(
  transactions: readonly Transaction[],
  period: DateRange,
): TransactionTotals {
  return calculateAllTimeTotals(filterTransactionsByPeriod(transactions, period));
}

export function calculateMonthTotals(
  transactions: readonly Transaction[],
  month: string | Date,
  firstDay = 1,
): TransactionTotals {
  return calculatePeriodTotals(
    transactions,
    getBillingPeriodForMonth(month, firstDay),
  );
}

export function calculateDayTotals(
  transactions: readonly Transaction[],
  day: string | Date,
): TransactionTotals {
  return calculatePeriodTotals(transactions, getDayRange(day));
}

export function calculateCategoryShares(
  transactions: readonly Transaction[],
  period?: DateRange,
): CategoryShare[] {
  const source = period ? filterTransactionsByPeriod(transactions, period) : transactions;
  const categoryTotals = new Map<CategoryId, number>();
  let totalExpenses = 0;

  for (const transaction of source) {
    const amount = getTransactionMinorUnits(transaction);

    if (
      transaction.type !== 'expense' ||
      amount === null ||
      !isCategoryForType(transaction.category, 'expense')
    ) {
      continue;
    }

    totalExpenses += amount;
    categoryTotals.set(
      transaction.category,
      (categoryTotals.get(transaction.category) ?? 0) + amount,
    );
  }

  if (totalExpenses === 0) {
    return [];
  }

  return Array.from(categoryTotals, ([category, amount]) => ({
    category,
    amount: fromMinorUnits(amount),
    percentage: Math.round((amount / totalExpenses) * 10_000) / 100,
  })).sort((left, right) => right.amount - left.amount);
}

export function calculateAverageDailyExpense(
  transactions: readonly Transaction[],
  period: DateRange,
  through?: Date,
): number {
  const dayCount = through
    ? countElapsedDays(period, through)
    : countCalendarDays(period);

  if (dayCount === 0) {
    return 0;
  }

  const expensePeriod = through
    ? {
        start: period.start,
        end: new Date(
          Math.min(period.end.getTime(), getDayRange(through).end.getTime()),
        ),
      }
    : period;
  const expenses = calculatePeriodTotals(transactions, expensePeriod).expenses;
  return roundMoney(expenses / dayCount);
}

export function getTopExpenseCategory(
  transactions: readonly Transaction[],
  period?: DateRange,
): CategoryShare | null {
  return calculateCategoryShares(transactions, period)[0] ?? null;
}

export function compareExpensesWithPreviousPeriod(
  transactions: readonly Transaction[],
  currentPeriod: DateRange,
): ExpenseComparison {
  const current = calculatePeriodTotals(transactions, currentPeriod).expenses;
  const previous = calculatePeriodTotals(
    transactions,
    getPreviousBillingPeriod(currentPeriod),
  ).expenses;
  const difference = roundMoney(current - previous);

  return {
    current,
    previous,
    difference,
    percentageChange: previous === 0
      ? current === 0 ? 0 : null
      : Math.round((difference / previous) * 10_000) / 100,
  };
}

export function compareExpensesWithPreviousMonth(
  transactions: readonly Transaction[],
  month: string | Date,
  firstDay = 1,
): ExpenseComparison {
  return compareExpensesWithPreviousPeriod(
    transactions,
    getBillingPeriodForMonth(month, firstDay),
  );
}

export function calculateExpenseAnalytics(
  transactions: readonly Transaction[],
  period: DateRange,
  through?: Date,
): ExpenseAnalytics {
  const categoryShares = calculateCategoryShares(transactions, period);

  return {
    totals: calculatePeriodTotals(transactions, period),
    categoryShares,
    averagePerDay: calculateAverageDailyExpense(transactions, period, through),
    topCategory: categoryShares[0] ?? null,
    comparison: compareExpensesWithPreviousPeriod(transactions, period),
  };
}

export function sortTransactionsNewestFirst(
  transactions: readonly Transaction[],
): Transaction[] {
  return transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((left, right) => {
      const leftDate = parseDate(left.transaction.createdAt)?.getTime() ?? 0;
      const rightDate = parseDate(right.transaction.createdAt)?.getTime() ?? 0;
      return rightDate - leftDate || left.index - right.index;
    })
    .map(({ transaction }) => transaction);
}
