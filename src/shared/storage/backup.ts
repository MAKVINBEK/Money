import { getCategory } from '../data/categories';
import type {
  AppSettings,
  BackupData,
  CurrencyCode,
  Transaction,
} from '../types/finance';
import { isValidDateValue } from '../utils/date';
import {
  LOCAL_DATA_VERSION,
  type ValidationResult,
  validateSettings,
  validateTransactions,
} from './localData';

export const BACKUP_VERSION = LOCAL_DATA_VERSION;
export const CSV_BOM = '\uFEFF';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function createBackup(
  transactions: readonly Transaction[],
  settings: AppSettings,
  createdAt = new Date(),
): BackupData {
  return {
    version: BACKUP_VERSION,
    transactions: transactions.map((transaction) => ({ ...transaction })),
    settings: { ...settings },
    createdAt: createdAt.toISOString(),
  };
}

export function serializeBackup(
  transactions: readonly Transaction[],
  settings: AppSettings,
  createdAt = new Date(),
): string {
  return JSON.stringify(createBackup(transactions, settings, createdAt), null, 2);
}

export function validateBackup(value: unknown): ValidationResult<BackupData> {
  if (!isRecord(value)) {
    return { success: false, error: 'Резервная копия должна быть объектом' };
  }

  if (value.version !== BACKUP_VERSION) {
    return { success: false, error: 'Неподдерживаемая версия резервной копии' };
  }

  if (!isValidDateValue(value.createdAt)) {
    return { success: false, error: 'Некорректная дата создания резервной копии' };
  }

  const transactions = validateTransactions(value.transactions);

  if (!transactions.success) {
    return { success: false, error: transactions.error };
  }

  const settings = validateSettings(value.settings);

  if (!settings.success) {
    return { success: false, error: settings.error };
  }

  return {
    success: true,
    data: {
      version: BACKUP_VERSION,
      transactions: transactions.data,
      settings: settings.data,
      createdAt: value.createdAt,
    },
  };
}

/** Parses and validates the complete payload without mutating current app data. */
export function parseBackupJson(rawValue: string): ValidationResult<BackupData> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue) as unknown;
  } catch {
    return { success: false, error: 'Файл не содержит корректный JSON' };
  }

  return validateBackup(parsed);
}

export const parseBackup = parseBackupJson;

export function escapeCsvField(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function transactionsToCsv(
  transactions: readonly Transaction[],
  currency: CurrencyCode = 'KGS',
): string {
  const header = ['Дата', 'Тип', 'Категория', 'Описание', 'Сумма', 'Валюта'];
  const rows = transactions.map((transaction) => {
    const category = getCategory(transaction.category, transaction.type);
    return [
      transaction.createdAt,
      transaction.type === 'income' ? 'Доход' : 'Расход',
      category?.label ?? 'Другое',
      transaction.description,
      transaction.amount.toFixed(2),
      currency,
    ];
  });

  return CSV_BOM + [header, ...rows]
    .map((row) => row.map(escapeCsvField).join(';'))
    .join('\r\n');
}

export const exportTransactionsToCsv = transactionsToCsv;
