import type { AppSettings, Transaction } from '../types/finance';
import {
  SETTINGS_STORAGE_KEY,
  TRANSACTIONS_STORAGE_KEY,
  safeGetItem,
  safeRemoveItem,
  safeSetItem,
  saveSettings,
  saveTransactions,
  type StorageLike,
  type StorageOperationResult,
  validateSettings,
  validateTransactions,
} from './localData';

export const LOCAL_DATA_WRITE_JOURNAL_KEY = 'akcha-local-data-journal-v1';

interface LocalDataWriteJournal {
  version: 1;
  state: 'pending' | 'committed';
  transactions: string | null;
  settings: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parseJournal(rawValue: string): LocalDataWriteJournal | null {
  let value: unknown;

  try {
    value = JSON.parse(rawValue) as unknown;
  } catch {
    return null;
  }

  if (
    !isRecord(value) ||
    value.version !== 1 ||
    (value.state !== 'pending' && value.state !== 'committed') ||
    (typeof value.transactions !== 'string' && value.transactions !== null) ||
    (typeof value.settings !== 'string' && value.settings !== null)
  ) {
    return null;
  }

  return {
    version: 1,
    state: value.state,
    transactions: value.transactions,
    settings: value.settings,
  };
}

function restoreValue(
  key: string,
  value: string | null,
  storage?: StorageLike | null,
): StorageOperationResult<void> {
  return value === null
    ? safeRemoveItem(key, storage)
    : safeSetItem(key, value, storage);
}

function restorePendingWrite(
  journal: LocalDataWriteJournal,
  storage?: StorageLike | null,
): StorageOperationResult<void> {
  const transactionResult = restoreValue(
    TRANSACTIONS_STORAGE_KEY,
    journal.transactions,
    storage,
  );
  const settingsResult = restoreValue(
    SETTINGS_STORAGE_KEY,
    journal.settings,
    storage,
  );

  if (!transactionResult.ok || !settingsResult.ok) {
    return {
      ok: false,
      error: !transactionResult.ok
        ? transactionResult.error
        : settingsResult.ok
          ? 'Не удалось восстановить локальные данные'
          : settingsResult.error,
    };
  }

  return safeRemoveItem(LOCAL_DATA_WRITE_JOURNAL_KEY, storage);
}

/** Restores the old pair of storage keys after a crash during replacement. */
export function recoverInterruptedLocalDataWrite(
  storage?: StorageLike | null,
): StorageOperationResult<void> {
  const storedJournal = safeGetItem(LOCAL_DATA_WRITE_JOURNAL_KEY, storage);

  if (!storedJournal.ok || storedJournal.value === null) {
    return storedJournal.ok
      ? { ok: true, value: undefined }
      : storedJournal;
  }

  const journal = parseJournal(storedJournal.value);

  if (!journal) {
    return { ok: false, error: 'Повреждён журнал замены локальных данных' };
  }

  return journal.state === 'committed'
    ? safeRemoveItem(LOCAL_DATA_WRITE_JOURNAL_KEY, storage)
    : restorePendingWrite(journal, storage);
}

/** Replaces transactions and settings as one recoverable local operation. */
export function replaceLocalData(
  transactions: readonly Transaction[],
  settings: AppSettings,
  storage?: StorageLike | null,
): StorageOperationResult<void> {
  const validTransactions = validateTransactions(transactions);

  if (!validTransactions.success) {
    return { ok: false, error: validTransactions.error };
  }

  const validSettings = validateSettings(settings);

  if (!validSettings.success) {
    return { ok: false, error: validSettings.error };
  }

  const currentTransactions = safeGetItem(TRANSACTIONS_STORAGE_KEY, storage);
  const currentSettings = safeGetItem(SETTINGS_STORAGE_KEY, storage);

  if (!currentTransactions.ok || !currentSettings.ok) {
    return {
      ok: false,
      error: !currentTransactions.ok
        ? currentTransactions.error
        : currentSettings.ok
          ? 'Не удалось прочитать текущие локальные данные'
          : currentSettings.error,
    };
  }

  const journal: LocalDataWriteJournal = {
    version: 1,
    state: 'pending',
    transactions: currentTransactions.value,
    settings: currentSettings.value,
  };
  const journalResult = safeSetItem(
    LOCAL_DATA_WRITE_JOURNAL_KEY,
    JSON.stringify(journal),
    storage,
  );

  if (!journalResult.ok) {
    return { ok: false, error: journalResult.error };
  }

  const transactionResult = saveTransactions(validTransactions.data, storage);

  if (!transactionResult.ok) {
    const rollback = restorePendingWrite(journal, storage);
    return {
      ok: false,
      error: rollback.ok
        ? transactionResult.error
        : `${transactionResult.error}. Восстановление продолжится при следующем запуске: ${rollback.error}`,
    };
  }

  const settingsResult = saveSettings(validSettings.data, storage);

  if (!settingsResult.ok) {
    const rollback = restorePendingWrite(journal, storage);
    return {
      ok: false,
      error: rollback.ok
        ? settingsResult.error
        : `${settingsResult.error}. Восстановление продолжится при следующем запуске: ${rollback.error}`,
    };
  }

  const committedJournal: LocalDataWriteJournal = {
    ...journal,
    state: 'committed',
  };
  const committedResult = safeSetItem(
    LOCAL_DATA_WRITE_JOURNAL_KEY,
    JSON.stringify(committedJournal),
    storage,
  );

  if (!committedResult.ok) {
    const rollback = restorePendingWrite(journal, storage);
    return {
      ok: false,
      error: rollback.ok
        ? committedResult.error
        : `${committedResult.error}. Восстановление продолжится при следующем запуске: ${rollback.error}`,
    };
  }

  // A committed journal is harmless if cleanup fails: the next launch removes it
  // without rolling back the successfully written pair.
  safeRemoveItem(LOCAL_DATA_WRITE_JOURNAL_KEY, storage);
  return { ok: true, value: undefined };
}
