import { isCategoryForType } from '../data/categories';
import type {
  AppSettings,
  CurrencyCode,
  ThemePreference,
  Transaction,
  TransactionType,
} from '../types/finance';
import { isValidDateValue } from '../utils/date';
import { normalizePositiveAmount } from '../utils/finance';

export const LOCAL_DATA_VERSION = 2 as const;
export const TRANSACTIONS_STORAGE_KEY = 'money-transactions';
export const SETTINGS_STORAGE_KEY = 'akcha-settings';
export const TRANSACTIONS_RECOVERY_KEY = 'money-transactions-recovery-v1';
export const DAMAGED_TRANSACTIONS_RECOVERY_KEY =
  'money-transactions-recovery-damaged-v2';
export const PREVIOUS_DAMAGED_TRANSACTIONS_RECOVERY_KEY =
  'money-transactions-recovery-damaged-previous-v2';

export const DEFAULT_SETTINGS: Readonly<AppSettings> = Object.freeze({
  theme: 'system',
  currency: 'KGS',
  budget: 0,
  firstDay: 1,
  balanceHidden: false,
});

export interface TransactionsEnvelope {
  version: typeof LOCAL_DATA_VERSION;
  transactions: Transaction[];
}

export interface SettingsEnvelope {
  version: typeof LOCAL_DATA_VERSION;
  settings: AppSettings;
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type StorageOperationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type LocalDataLoadResult<T> =
  | { ok: true; value: T; migrated: boolean }
  | {
      ok: false;
      value: T;
      migrated: false;
      error: string;
      /** False only when the original payload is already safely recoverable. */
      writeBlocked?: boolean;
    };

export interface TransactionSalvageResult {
  transactions: Transaction[];
  rejectedCount: number;
  errors: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTransactionType = (value: unknown): value is TransactionType =>
  value === 'income' || value === 'expense';

const isTheme = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

const isCurrency = (value: unknown): value is CurrencyCode =>
  value === 'KGS' || value === 'RUB' || value === 'USD';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Неизвестная ошибка локального хранилища';

const getBrowserStorage = (): StorageLike | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
};

const resolveStorage = (storage?: StorageLike | null): StorageLike | null =>
  storage === undefined ? getBrowserStorage() : storage;

export function safeGetItem(
  key: string,
  storage?: StorageLike | null,
): StorageOperationResult<string | null> {
  const target = resolveStorage(storage);

  if (!target) {
    return { ok: false, error: 'Локальное хранилище недоступно' };
  }

  try {
    return { ok: true, value: target.getItem(key) };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export function safeSetItem(
  key: string,
  value: string,
  storage?: StorageLike | null,
): StorageOperationResult<void> {
  const target = resolveStorage(storage);

  if (!target) {
    return { ok: false, error: 'Локальное хранилище недоступно' };
  }

  try {
    target.setItem(key, value);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export function safeRemoveItem(
  key: string,
  storage?: StorageLike | null,
): StorageOperationResult<void> {
  const target = resolveStorage(storage);

  if (!target) {
    return { ok: false, error: 'Локальное хранилище недоступно' };
  }

  try {
    target.removeItem(key);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export function validateTransaction(
  value: unknown,
  allowLegacyFields = false,
): ValidationResult<Transaction> {
  if (!isRecord(value)) {
    return { success: false, error: 'Операция должна быть объектом' };
  }

  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const description = typeof value.description === 'string'
    ? value.description.trim()
    : null;

  if (!id) {
    return { success: false, error: 'У операции отсутствует id' };
  }

  if (description === null) {
    return { success: false, error: `У операции ${id} некорректное описание` };
  }

  if (!isTransactionType(value.type)) {
    return { success: false, error: `У операции ${id} некорректный тип` };
  }

  if (typeof value.amount !== 'number') {
    return { success: false, error: `У операции ${id} некорректная сумма` };
  }

  const amount = normalizePositiveAmount(value.amount);

  if (amount === null) {
    return { success: false, error: `У операции ${id} сумма должна быть больше нуля` };
  }

  if (!isValidDateValue(value.createdAt)) {
    return { success: false, error: `У операции ${id} некорректная дата` };
  }

  const category = value.category === undefined && allowLegacyFields
    ? 'other'
    : value.category;

  if (!isCategoryForType(category, value.type)) {
    return { success: false, error: `У операции ${id} некорректная категория` };
  }

  const updatedAt = value.updatedAt === undefined && allowLegacyFields
    ? value.createdAt
    : value.updatedAt;

  if (!isValidDateValue(updatedAt)) {
    return { success: false, error: `У операции ${id} некорректная дата изменения` };
  }

  return {
    success: true,
    data: {
      id,
      description,
      amount,
      type: value.type,
      category,
      createdAt: value.createdAt,
      updatedAt,
    },
  };
}

export function validateTransactions(
  value: unknown,
  allowLegacyFields = false,
): ValidationResult<Transaction[]> {
  if (!Array.isArray(value)) {
    return { success: false, error: 'Список операций должен быть массивом' };
  }

  const transactions: Transaction[] = [];
  const ids = new Set<string>();

  for (const [index, item] of value.entries()) {
    const parsed = validateTransaction(item, allowLegacyFields);

    if (!parsed.success) {
      return { success: false, error: `Операция ${index + 1}: ${parsed.error}` };
    }

    if (ids.has(parsed.data.id)) {
      return { success: false, error: `Повторяющийся id операции: ${parsed.data.id}` };
    }

    ids.add(parsed.data.id);
    transactions.push(parsed.data);
  }

  return { success: true, data: transactions };
}

/**
 * Recovers individually valid records for display without making a damaged
 * payload eligible for persistence or backup import.
 */
export function salvageTransactions(
  value: unknown,
  allowLegacyFields = false,
): TransactionSalvageResult {
  if (!Array.isArray(value)) {
    return {
      transactions: [],
      rejectedCount: 1,
      errors: ['Список операций должен быть массивом'],
    };
  }

  const transactions: Transaction[] = [];
  const ids = new Set<string>();
  const errors: string[] = [];

  for (const [index, item] of value.entries()) {
    const parsed = validateTransaction(item, allowLegacyFields);

    if (!parsed.success) {
      errors.push(`Операция ${index + 1}: ${parsed.error}`);
      continue;
    }

    if (ids.has(parsed.data.id)) {
      errors.push(`Операция ${index + 1}: повторяющийся id ${parsed.data.id}`);
      continue;
    }

    ids.add(parsed.data.id);
    transactions.push(parsed.data);
  }

  return {
    transactions,
    rejectedCount: errors.length,
    errors,
  };
}

export function validateSettings(value: unknown): ValidationResult<AppSettings> {
  if (!isRecord(value)) {
    return { success: false, error: 'Настройки должны быть объектом' };
  }

  if (!isTheme(value.theme)) {
    return { success: false, error: 'Некорректная тема' };
  }

  if (!isCurrency(value.currency)) {
    return { success: false, error: 'Некорректная валюта' };
  }

  const budget = value.budget === 0 && typeof value.budget === 'number'
    ? 0
    : normalizePositiveAmount(value.budget);

  if (budget === null) {
    return { success: false, error: 'Бюджет должен быть конечным неотрицательным числом' };
  }

  if (
    typeof value.firstDay !== 'number' ||
    !Number.isInteger(value.firstDay) ||
    value.firstDay < 1 ||
    value.firstDay > 28
  ) {
    return { success: false, error: 'Первый день периода должен быть от 1 до 28' };
  }

  if (typeof value.balanceHidden !== 'boolean') {
    return { success: false, error: 'Некорректная настройка видимости баланса' };
  }

  return {
    success: true,
    data: {
      theme: value.theme,
      currency: value.currency,
      budget,
      firstDay: value.firstDay,
      balanceHidden: value.balanceHidden,
    },
  };
}

export function validateTransactionsEnvelope(
  value: unknown,
): ValidationResult<TransactionsEnvelope> {
  if (!isRecord(value) || value.version !== LOCAL_DATA_VERSION) {
    return { success: false, error: 'Неподдерживаемая версия данных операций' };
  }

  const transactions = validateTransactions(value.transactions);
  return transactions.success
    ? {
        success: true,
        data: { version: LOCAL_DATA_VERSION, transactions: transactions.data },
      }
    : transactions;
}

export function validateSettingsEnvelope(
  value: unknown,
): ValidationResult<SettingsEnvelope> {
  if (!isRecord(value) || value.version !== LOCAL_DATA_VERSION) {
    return { success: false, error: 'Неподдерживаемая версия настроек' };
  }

  const settings = validateSettings(value.settings);
  return settings.success
    ? {
        success: true,
        data: { version: LOCAL_DATA_VERSION, settings: settings.data },
      }
    : settings;
}

const parseJson = (rawValue: string): ValidationResult<unknown> => {
  try {
    return { success: true, data: JSON.parse(rawValue) as unknown };
  } catch {
    return { success: false, error: 'Повреждённый JSON в локальном хранилище' };
  }
};

function preserveDamagedTransactions(
  rawValue: string,
  storage?: StorageLike | null,
): StorageOperationResult<void> {
  const existingRecovery = safeGetItem(
    DAMAGED_TRANSACTIONS_RECOVERY_KEY,
    storage,
  );

  if (!existingRecovery.ok) {
    return existingRecovery;
  }

  if (existingRecovery.value === null) {
    return safeSetItem(
      DAMAGED_TRANSACTIONS_RECOVERY_KEY,
      rawValue,
      storage,
    );
  }

  if (existingRecovery.value === rawValue) {
    return { ok: true, value: undefined };
  }

  const rotatedRecovery = safeSetItem(
    PREVIOUS_DAMAGED_TRANSACTIONS_RECOVERY_KEY,
    existingRecovery.value,
    storage,
  );

  if (!rotatedRecovery.ok) {
    return rotatedRecovery;
  }

  return safeSetItem(
    DAMAGED_TRANSACTIONS_RECOVERY_KEY,
    rawValue,
    storage,
  );
}

function withRecoveryError(
  error: string,
  recovery: StorageOperationResult<void>,
): string {
  return recovery.ok
    ? error
    : `${error}. Не удалось сохранить recovery-копию: ${recovery.error}`;
}

export function saveTransactions(
  transactions: readonly Transaction[],
  storage?: StorageLike | null,
): StorageOperationResult<void> {
  const validated = validateTransactions(transactions);

  if (!validated.success) {
    return { ok: false, error: validated.error };
  }

  const envelope: TransactionsEnvelope = {
    version: LOCAL_DATA_VERSION,
    transactions: validated.data,
  };

  return safeSetItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(envelope), storage);
}

export function loadTransactions(
  storage?: StorageLike | null,
): LocalDataLoadResult<Transaction[]> {
  const stored = safeGetItem(TRANSACTIONS_STORAGE_KEY, storage);

  if (!stored.ok) {
    return { ok: false, value: [], migrated: false, error: stored.error };
  }

  if (stored.value === null) {
    return { ok: true, value: [], migrated: false };
  }

  const parsed = parseJson(stored.value);

  if (!parsed.success) {
    const recovery = preserveDamagedTransactions(stored.value, storage);
    return {
      ok: false,
      value: [],
      migrated: false,
      error: withRecoveryError(parsed.error, recovery),
      writeBlocked: !recovery.ok,
    };
  }

  if (!Array.isArray(parsed.data)) {
    const envelope = validateTransactionsEnvelope(parsed.data);

    if (envelope.success) {
      return { ok: true, value: envelope.data.transactions, migrated: false };
    }

    if (
      isRecord(parsed.data) &&
      parsed.data.version === LOCAL_DATA_VERSION &&
      Array.isArray(parsed.data.transactions)
    ) {
      const salvaged = salvageTransactions(parsed.data.transactions);
      const recovery = preserveDamagedTransactions(stored.value, storage);
      return {
        ok: false,
        value: salvaged.transactions,
        migrated: false,
        error: withRecoveryError(
          salvaged.errors[0] ?? envelope.error,
          recovery,
        ),
        writeBlocked: !recovery.ok,
      };
    }

    const recovery = preserveDamagedTransactions(stored.value, storage);
    return {
      ok: false,
      value: [],
      migrated: false,
      error: withRecoveryError(envelope.error, recovery),
      writeBlocked: !recovery.ok,
    };
  }

  const legacyTransactions = salvageTransactions(parsed.data, true);

  if (legacyTransactions.rejectedCount > 0) {
    const recovery = preserveDamagedTransactions(stored.value, storage);
    return {
      ok: false,
      value: legacyTransactions.transactions,
      migrated: false,
      error: withRecoveryError(
        legacyTransactions.errors[0] ?? 'Часть операций повреждена',
        recovery,
      ),
      writeBlocked: !recovery.ok,
    };
  }

  const existingRecovery = safeGetItem(TRANSACTIONS_RECOVERY_KEY, storage);

  if (!existingRecovery.ok) {
    return {
      ok: false,
      value: legacyTransactions.transactions,
      migrated: false,
      error: existingRecovery.error,
    };
  }

  if (existingRecovery.value === null) {
    const recovery = safeSetItem(TRANSACTIONS_RECOVERY_KEY, stored.value, storage);

    if (!recovery.ok) {
      return {
        ok: false,
        value: legacyTransactions.transactions,
        migrated: false,
        error: recovery.error,
      };
    }
  }

  const saved = saveTransactions(legacyTransactions.transactions, storage);

  return saved.ok
    ? { ok: true, value: legacyTransactions.transactions, migrated: true }
    : {
        ok: false,
        value: legacyTransactions.transactions,
        migrated: false,
        error: saved.error,
        writeBlocked: false,
      };
}

export function saveSettings(
  settings: AppSettings,
  storage?: StorageLike | null,
): StorageOperationResult<void> {
  const validated = validateSettings(settings);

  if (!validated.success) {
    return { ok: false, error: validated.error };
  }

  const envelope: SettingsEnvelope = {
    version: LOCAL_DATA_VERSION,
    settings: validated.data,
  };

  return safeSetItem(SETTINGS_STORAGE_KEY, JSON.stringify(envelope), storage);
}

export function loadSettings(
  storage?: StorageLike | null,
): LocalDataLoadResult<AppSettings> {
  const defaults = { ...DEFAULT_SETTINGS };
  const stored = safeGetItem(SETTINGS_STORAGE_KEY, storage);

  if (!stored.ok) {
    return { ok: false, value: defaults, migrated: false, error: stored.error };
  }

  if (stored.value === null) {
    return { ok: true, value: defaults, migrated: false };
  }

  const parsed = parseJson(stored.value);

  if (!parsed.success) {
    return { ok: false, value: defaults, migrated: false, error: parsed.error };
  }

  const envelope = validateSettingsEnvelope(parsed.data);

  if (envelope.success) {
    return { ok: true, value: envelope.data.settings, migrated: false };
  }

  // Accept a plain settings object once, so early Akcha builds can migrate safely.
  const legacySettings = validateSettings(parsed.data);

  if (!legacySettings.success) {
    return { ok: false, value: defaults, migrated: false, error: envelope.error };
  }

  const saved = saveSettings(legacySettings.data, storage);
  return saved.ok
    ? { ok: true, value: legacySettings.data, migrated: true }
    : { ok: false, value: legacySettings.data, migrated: false, error: saved.error };
}
