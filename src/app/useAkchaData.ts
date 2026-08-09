import { useRef, useState } from 'react';
import {
  LOCAL_DATA_WRITE_JOURNAL_KEY,
  recoverInterruptedLocalDataWrite,
  replaceLocalData,
} from '../shared/storage/atomicLocalData';
import {
  DAMAGED_TRANSACTIONS_RECOVERY_KEY,
  DEFAULT_SETTINGS,
  PREVIOUS_DAMAGED_TRANSACTIONS_RECOVERY_KEY,
  SETTINGS_STORAGE_KEY,
  TRANSACTIONS_RECOVERY_KEY,
  TRANSACTIONS_STORAGE_KEY,
  loadSettings,
  loadTransactions,
  safeRemoveItem,
  saveSettings,
  saveTransactions,
} from '../shared/storage/localData';
import type {
  AppSettings,
  BackupData,
  Transaction,
  TransactionInput,
} from '../shared/types/finance';

interface InitialData {
  transactions: Transaction[];
  settings: AppSettings;
  errors: StorageErrors;
  writeBlocks: {
    journal: boolean;
    transactions: boolean;
    settings: boolean;
  };
}

interface StorageErrors {
  journal: string | null;
  transactions: string | null;
  settings: string | null;
  global: string | null;
}

function loadInitialData(): InitialData {
  const interruptedWriteRecovery = recoverInterruptedLocalDataWrite();
  const transactionResult = loadTransactions();
  const settingsResult = loadSettings();

  return {
    transactions: transactionResult.value,
    settings: settingsResult.value,
    errors: {
      journal: interruptedWriteRecovery.ok
        ? null
        : interruptedWriteRecovery.error,
      transactions: transactionResult.ok ? null : transactionResult.error,
      settings: settingsResult.ok ? null : settingsResult.error,
      global: null,
    },
    writeBlocks: {
      journal: !interruptedWriteRecovery.ok,
      transactions:
        !transactionResult.ok && (transactionResult.writeBlocked ?? true),
      settings: !settingsResult.ok && (settingsResult.writeBlocked ?? true),
    },
  };
}

export function useAkchaData() {
  const [initialData] = useState(loadInitialData);
  const [transactions, setTransactions] = useState(initialData.transactions);
  const [settings, setSettings] = useState(initialData.settings);
  const [storageErrors, setStorageErrors] = useState(initialData.errors);
  const transactionsRef = useRef(transactions);
  const settingsRef = useRef(settings);
  const writeBlocksRef = useRef(initialData.writeBlocks);
  const setStorageError = (
    domain: keyof StorageErrors,
    error: string | null,
  ) => {
    setStorageErrors((currentErrors) => ({
      ...currentErrors,
      [domain]: error,
    }));
  };
  const reloadAfterJournalRecovery = (
    retryDomain: 'transactions' | 'settings',
  ) => {
    const transactionResult = loadTransactions();
    const settingsResult = loadSettings();

    transactionsRef.current = transactionResult.value;
    settingsRef.current = settingsResult.value;
    setTransactions(transactionResult.value);
    setSettings(settingsResult.value);
    writeBlocksRef.current = {
      journal: false,
      transactions:
        !transactionResult.ok && (transactionResult.writeBlocked ?? true),
      settings: !settingsResult.ok && (settingsResult.writeBlocked ?? true),
    };
    setStorageErrors({
      journal: null,
      transactions: transactionResult.ok
        ? retryDomain === 'transactions'
          ? 'Локальные данные восстановлены. Повторите действие'
          : null
        : transactionResult.error,
      settings: settingsResult.ok
        ? retryDomain === 'settings'
          ? 'Локальные данные восстановлены. Повторите действие'
          : null
        : settingsResult.error,
      global: null,
    });
  };

  const ensureWriteAllowed = (
    domain: 'transactions' | 'settings',
  ): boolean => {
    if (writeBlocksRef.current.journal) {
      const recovery = recoverInterruptedLocalDataWrite();

      if (!recovery.ok) {
        setStorageError(
          'journal',
          `Запись заблокирована до восстановления локальных данных: ${recovery.error}`,
        );
        return false;
      }

      reloadAfterJournalRecovery(domain);
      return false;
    }

    if (writeBlocksRef.current[domain]) {
      setStorageError(
        domain,
        domain === 'transactions'
          ? 'Операции доступны только для чтения: сначала экспортируйте данные, импортируйте корректную копию или очистите хранилище'
          : 'Настройки доступны только для чтения: импортируйте корректную копию или очистите хранилище',
      );
      return false;
    }

    return true;
  };

  const commitTransactions = (nextTransactions: Transaction[]): boolean => {
    if (!ensureWriteAllowed('transactions')) {
      return false;
    }

    const result = saveTransactions(nextTransactions);

    if (!result.ok) {
      setStorageError(
        'transactions',
        `Не удалось сохранить операции: ${result.error}`,
      );
      return false;
    }

    transactionsRef.current = nextTransactions;
    setTransactions(nextTransactions);
    setStorageError('transactions', null);
    return true;
  };

  const commitSettings = (nextSettings: AppSettings): boolean => {
    if (!ensureWriteAllowed('settings')) {
      return false;
    }

    const result = saveSettings(nextSettings);

    if (!result.ok) {
      setStorageError(
        'settings',
        `Не удалось сохранить настройки: ${result.error}`,
      );
      return false;
    }

    settingsRef.current = nextSettings;
    setSettings(nextSettings);
    setStorageError('settings', null);
    return true;
  };

  const addTransaction = (input: TransactionInput): boolean => {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...input,
      id: crypto.randomUUID(),
      updatedAt: now,
    };

    return commitTransactions([transaction, ...transactionsRef.current]);
  };

  const updateTransaction = (
    id: string,
    input: TransactionInput,
  ): boolean => {
    if (!transactionsRef.current.some((transaction) => transaction.id === id)) {
      setStorageError(
        'transactions',
        'Операция не найдена после восстановления данных. Закройте форму и попробуйте снова',
      );
      return false;
    }

    const nextTransactions = transactionsRef.current.map((transaction) =>
      transaction.id === id
        ? {
            ...transaction,
            ...input,
            updatedAt: new Date().toISOString(),
          }
        : transaction,
    );

    return commitTransactions(nextTransactions);
  };

  const deleteTransaction = (id: string): boolean => {
    if (!transactionsRef.current.some((transaction) => transaction.id === id)) {
      setStorageError('transactions', 'Операция уже отсутствует');
      return false;
    }

    return commitTransactions(
      transactionsRef.current.filter((transaction) => transaction.id !== id),
    );
  };

  const restoreTransaction = (transaction: Transaction): boolean => {
    if (transactionsRef.current.some((item) => item.id === transaction.id)) {
      return true;
    }

    return commitTransactions([transaction, ...transactionsRef.current]);
  };

  const updateSettings = (patch: Partial<AppSettings>): boolean =>
    commitSettings({ ...settingsRef.current, ...patch });

  const importBackup = (backup: BackupData): boolean => {
    if (writeBlocksRef.current.journal) {
      const recovery = recoverInterruptedLocalDataWrite();

      if (!recovery.ok) {
        setStorageError('journal', `Импорт заблокирован: ${recovery.error}`);
        return false;
      }

      writeBlocksRef.current.journal = false;
      setStorageError('journal', null);
    }

    const result = replaceLocalData(backup.transactions, backup.settings);

    if (!result.ok) {
      const recovery = recoverInterruptedLocalDataWrite();
      writeBlocksRef.current.journal = !recovery.ok;
      setStorageError('global', `Импорт не выполнен: ${result.error}`);
      return false;
    }

    transactionsRef.current = backup.transactions;
    settingsRef.current = backup.settings;
    setTransactions(backup.transactions);
    setSettings(backup.settings);
    writeBlocksRef.current = {
      journal: false,
      transactions: false,
      settings: false,
    };
    setStorageErrors({
      journal: null,
      transactions: null,
      settings: null,
      global: null,
    });
    return true;
  };

  const clearAllData = (): boolean => {
    const keysToRemove = [
      TRANSACTIONS_STORAGE_KEY,
      SETTINGS_STORAGE_KEY,
      TRANSACTIONS_RECOVERY_KEY,
      DAMAGED_TRANSACTIONS_RECOVERY_KEY,
      PREVIOUS_DAMAGED_TRANSACTIONS_RECOVERY_KEY,
      LOCAL_DATA_WRITE_JOURNAL_KEY,
    ];
    const failedRemoval = keysToRemove
      .map((key) => safeRemoveItem(key))
      .find((result) => !result.ok);

    if (failedRemoval && !failedRemoval.ok) {
      setStorageError(
        'global',
        `Не удалось очистить данные: ${failedRemoval.error}`,
      );
      return false;
    }

    transactionsRef.current = [];
    settingsRef.current = { ...DEFAULT_SETTINGS };
    setTransactions([]);
    setSettings({ ...DEFAULT_SETTINGS });
    writeBlocksRef.current = {
      journal: false,
      transactions: false,
      settings: false,
    };
    setStorageErrors({
      journal: null,
      transactions: null,
      settings: null,
      global: null,
    });
    return true;
  };

  return {
    transactions,
    settings,
    storageError:
      Object.values(storageErrors).filter(Boolean).join('. ') || null,
    clearStorageError: () =>
      setStorageErrors({
        journal: null,
        transactions: null,
        settings: null,
        global: null,
      }),
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreTransaction,
    updateSettings,
    importBackup,
    clearAllData,
  };
}
