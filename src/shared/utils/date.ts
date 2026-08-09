import type { DateRange } from '../types/finance';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

const hasValidCalendarDate = (year: number, month: number, day: number): boolean => {
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day;
};

const assertValidDate = (value: Date): void => {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError('Invalid date');
  }
};

export function normalizeFirstDay(value: number): number {
  return Number.isInteger(value) && value >= 1 && value <= 28 ? value : 1;
}

export function parseDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(value);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const parsed = new Date(year, month - 1, day);

    return parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
      ? parsed
      : null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isValidDateValue(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  const match = DATE_ONLY_PATTERN.exec(value) ?? ISO_DATE_TIME_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  return hasValidCalendarDate(Number(match[1]), Number(match[2]), Number(match[3])) &&
    parseDate(value) !== null;
}

export function toDateKey(value: string | Date): string {
  const date = parseDate(value);

  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayRange(value: string | Date): DateRange {
  const date = parseDate(value);

  if (!date) {
    throw new RangeError('Invalid date');
  }

  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { start, end };
}

/** Returns the billing period that contains the supplied date. */
export function getBillingPeriod(value: string | Date, firstDay = 1): DateRange {
  const date = parseDate(value);

  if (!date) {
    throw new RangeError('Invalid date');
  }

  const normalizedFirstDay = normalizeFirstDay(firstDay);
  const startMonthOffset = date.getDate() < normalizedFirstDay ? -1 : 0;
  const start = new Date(
    date.getFullYear(),
    date.getMonth() + startMonthOffset,
    normalizedFirstDay,
  );
  const end = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    normalizedFirstDay,
  );

  return { start, end };
}

/** Returns the billing period whose start belongs to the supplied calendar month. */
export function getBillingPeriodForMonth(
  value: string | Date,
  firstDay = 1,
): DateRange {
  const date = parseDate(value);

  if (!date) {
    throw new RangeError('Invalid date');
  }

  const normalizedFirstDay = normalizeFirstDay(firstDay);
  return {
    start: new Date(date.getFullYear(), date.getMonth(), normalizedFirstDay),
    end: new Date(date.getFullYear(), date.getMonth() + 1, normalizedFirstDay),
  };
}

export function getPreviousBillingPeriod(period: DateRange): DateRange {
  assertValidDate(period.start);
  assertValidDate(period.end);

  const firstDay = normalizeFirstDay(period.start.getDate());
  const start = new Date(
    period.start.getFullYear(),
    period.start.getMonth() - 1,
    firstDay,
  );
  const end = new Date(
    period.start.getFullYear(),
    period.start.getMonth(),
    firstDay,
  );

  return { start, end };
}

export function shiftBillingPeriod(period: DateRange, monthOffset: number): DateRange {
  assertValidDate(period.start);
  const firstDay = normalizeFirstDay(period.start.getDate());
  const start = new Date(
    period.start.getFullYear(),
    period.start.getMonth() + Math.trunc(monthOffset),
    firstDay,
  );
  const end = new Date(start.getFullYear(), start.getMonth() + 1, firstDay);
  return { start, end };
}

export function isDateInRange(value: string | Date, range: DateRange): boolean {
  const date = parseDate(value);

  if (!date) {
    return false;
  }

  const timestamp = date.getTime();
  return timestamp >= range.start.getTime() && timestamp < range.end.getTime();
}

export function countCalendarDays(range: DateRange): number {
  assertValidDate(range.start);
  assertValidDate(range.end);

  const startUtc = Date.UTC(
    range.start.getFullYear(),
    range.start.getMonth(),
    range.start.getDate(),
  );
  const endUtc = Date.UTC(
    range.end.getFullYear(),
    range.end.getMonth(),
    range.end.getDate(),
  );

  return Math.max(0, Math.round((endUtc - startUtc) / 86_400_000));
}

export function countElapsedDays(range: DateRange, through: Date): number {
  assertValidDate(through);

  if (through.getTime() < range.start.getTime()) {
    return 0;
  }

  const effectiveEnd = through.getTime() >= range.end.getTime()
    ? range.end
    : new Date(through.getFullYear(), through.getMonth(), through.getDate() + 1);

  return countCalendarDays({
    start: range.start,
    end: effectiveEnd.getTime() > range.end.getTime() ? range.end : effectiveEnd,
  });
}
