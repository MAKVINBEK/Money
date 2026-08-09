import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Dashboard from '../features/dashboard/Dashboard';
import { TransactionSheet } from '../features/transactions/TransactionSheet';
import Transactions from '../features/transactions/Transactions';
import { BottomNavigation } from '../shared/components/BottomNavigation';
import type { AppScreen } from '../shared/components/BottomNavigation';
import { BottomSheet } from '../shared/components/BottomSheet';
import { Toast, type ToastTone } from '../shared/components/Toast';
import type {
  BackupData,
  Transaction,
  TransactionInput,
} from '../shared/types/finance';
import { getBillingPeriod } from '../shared/utils/date';
import { useAkchaData } from './useAkchaData';
import './App.css';

const Analytics = lazy(() => import('../features/analytics/Analytics'));
const Settings = lazy(() => import('../features/settings/Settings'));

interface Notice {
  id: number;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

const SCREEN_LABELS: Record<AppScreen, string> = {
  dashboard: 'Главная',
  transactions: 'Операции',
  analytics: 'Аналитика',
  settings: 'Настройки',
};

function getCurrentMonth(firstDay: number): Date {
  const currentPeriod = getBillingPeriod(new Date(), firstDay);
  return new Date(
    currentPeriod.start.getFullYear(),
    currentPeriod.start.getMonth(),
    1,
  );
}

function isSameMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

export default function App() {
  const data = useAkchaData();
  const [activeScreen, setActiveScreen] = useState<AppScreen>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getCurrentMonth(data.settings.firstDay),
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const previousScreenRef = useRef(activeScreen);

  useEffect(() => {
    if (previousScreenRef.current === activeScreen) {
      return undefined;
    }

    previousScreenRef.current = activeScreen;
    window.scrollTo(0, 0);
    const focusFrame = window.requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [activeScreen]);

  useEffect(() => {
    const root = document.documentElement;
    const themeMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    if (data.settings.theme === 'system') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = data.settings.theme;
    }

    const updateThemeColor = () => {
      const darkTheme =
        data.settings.theme === 'dark' ||
        (data.settings.theme === 'system' && media.matches);
      themeMeta?.setAttribute('content', darkTheme ? '#0D111A' : '#4F46E5');
    };

    updateThemeColor();
    media.addEventListener('change', updateThemeColor);

    return () => media.removeEventListener('change', updateThemeColor);
  }, [data.settings.theme]);

  const showNotice = (message: string, tone: ToastTone = 'neutral') => {
    setNotice({ id: Date.now(), message, tone });
  };

  const openNewTransaction = () => {
    setEditingTransaction(null);
    setSheetOpen(true);
  };

  const openTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSheetOpen(true);
  };

  const closeTransactionSheet = () => {
    setSheetOpen(false);
    setEditingTransaction(null);
  };

  const saveTransaction = (input: TransactionInput) => {
    const isEditing = editingTransaction !== null;
    const saved = editingTransaction
      ? data.updateTransaction(editingTransaction.id, input)
      : data.addTransaction(input);

    if (!saved) {
      return;
    }

    closeTransactionSheet();
    showNotice(
      isEditing ? 'Операция обновлена' : 'Операция добавлена',
      'success',
    );
  };

  const deleteTransaction = (transaction: Transaction) => {
    if (!data.deleteTransaction(transaction.id)) {
      return;
    }

    closeTransactionSheet();

    setNotice({
      id: Date.now(),
      message: 'Операция удалена',
      tone: 'neutral',
      actionLabel: 'Отменить',
      onAction: () => {
        if (data.restoreTransaction(transaction)) {
          showNotice('Операция восстановлена', 'success');
        } else {
          setNotice(null);
        }
      },
    });
  };

  const clearData = (): boolean => {
    const cleared = data.clearAllData();

    if (cleared) {
      setSelectedMonth(getCurrentMonth(1));
    }

    return cleared;
  };

  const importData = (backup: BackupData): boolean => {
    const imported = data.importBackup(backup);

    if (imported) {
      setSelectedMonth(getCurrentMonth(backup.settings.firstDay));
    }

    return imported;
  };

  const updateSettings = (patch: Parameters<typeof data.updateSettings>[0]) => {
    const currentMonthWasSelected = isSameMonth(
      selectedMonth,
      getCurrentMonth(data.settings.firstDay),
    );
    const saved = data.updateSettings(patch);

    if (
      saved &&
      patch.firstDay !== undefined &&
      currentMonthWasSelected
    ) {
      setSelectedMonth(getCurrentMonth(patch.firstDay));
    }

    return saved;
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return (
          <Dashboard
            transactions={data.transactions}
            settings={data.settings}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onAdd={openNewTransaction}
            onShowAll={() => setActiveScreen('transactions')}
            onEdit={openTransaction}
            onToggleBalance={() =>
              data.updateSettings({
                balanceHidden: !data.settings.balanceHidden,
              })
            }
          />
        );

      case 'transactions':
        return (
          <Transactions
            transactions={data.transactions}
            settings={data.settings}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onEdit={openTransaction}
            onAdd={openNewTransaction}
          />
        );

      case 'analytics':
        return (
          <Analytics
            transactions={data.transactions}
            settings={data.settings}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        );

      case 'settings':
        return (
          <Settings
            transactions={data.transactions}
            settings={data.settings}
            onSettingsChange={updateSettings}
            onImport={importData}
            onClearData={clearData}
            onNotify={showNotice}
          />
        );
    }
  };

  return (
    <>
      <main
        ref={mainRef}
        className="app-shell"
        tabIndex={-1}
        aria-label={SCREEN_LABELS[activeScreen]}
      >
        <Suspense fallback={<div className="screen-loading">Загрузка…</div>}>
          {renderScreen()}
        </Suspense>
      </main>

      <BottomNavigation
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        onAdd={openNewTransaction}
      />

      <BottomSheet
        open={sheetOpen}
        title={editingTransaction ? 'Редактировать операцию' : 'Новая операция'}
        description={
          editingTransaction
            ? 'Измените данные и сохраните операцию'
            : 'Доход или расход за несколько секунд'
        }
        onClose={closeTransactionSheet}
      >
        <TransactionSheet
          key={editingTransaction?.id ?? 'new-transaction'}
          transaction={editingTransaction}
          settings={data.settings}
          onSubmit={saveTransaction}
          onDelete={deleteTransaction}
          onCancel={closeTransactionSheet}
        />
      </BottomSheet>

      <Toast
        key={notice?.id}
        open={notice !== null}
        message={notice?.message ?? ''}
        tone={notice?.tone}
        actionLabel={notice?.actionLabel}
        onAction={notice?.onAction}
        onDismiss={() => setNotice(null)}
      />

      <Toast
        open={notice === null && data.storageError !== null}
        message={data.storageError ?? ''}
        tone="error"
        duration={0}
        onDismiss={data.clearStorageError}
      />
    </>
  );
}
