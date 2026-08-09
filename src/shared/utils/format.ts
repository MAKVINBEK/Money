import type { CurrencyCode, DateRange } from '../types/finance';
import { parseDate } from './date';

const DEFAULT_LOCALE = 'ru-RU';

export function formatCurrency(
  value: number,
  currency: CurrencyCode = 'KGS',
  locale = DEFAULT_LOCALE,
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
  locale = DEFAULT_LOCALE,
): string {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat(locale, options).format(date) : '—';
}

export function formatPeriod(
  period: DateRange,
  locale = DEFAULT_LOCALE,
): string {
  const inclusiveEnd = new Date(period.end.getTime() - 1);
  const sameYear = period.start.getFullYear() === inclusiveEnd.getFullYear();
  const startFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
  const endFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${startFormatter.format(period.start)} — ${endFormatter.format(inclusiveEnd)}`;
}

export function formatPercentage(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat(DEFAULT_LOCALE, {
    maximumFractionDigits: 2,
  }).format(safeValue)}%`;
}
