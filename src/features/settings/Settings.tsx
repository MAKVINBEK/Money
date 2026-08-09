import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import type { ToastTone } from '../../shared/components/Toast';
import { Icon, type IconName } from '../../shared/icons/Icon';
import {
  parseBackupJson,
  serializeBackup,
  transactionsToCsv,
} from '../../shared/storage/backup';
import type {
  AppSettings,
  BackupData,
  CurrencyCode,
  ThemePreference,
  Transaction,
} from '../../shared/types/finance';
import './settings.css';

const LazyCalculator = lazy(async () => {
  const calculatorModule = await import('../calculator/Calculator');
  return { default: calculatorModule.Calculator };
});

const MAX_BACKUP_SIZE = 2 * 1024 * 1024;

const THEME_OPTIONS: readonly {
  value: ThemePreference;
  label: string;
  icon: IconName;
}[] = [
  { value: 'system', label: 'Системная', icon: 'system' },
  { value: 'light', label: 'Светлая', icon: 'sun' },
  { value: 'dark', label: 'Тёмная', icon: 'moon' },
];

const CURRENCY_OPTIONS: readonly {
  value: CurrencyCode;
  label: string;
}[] = [
  { value: 'KGS', label: 'KGS — сом' },
  { value: 'RUB', label: 'RUB — рубль' },
  { value: 'USD', label: 'USD — доллар' },
];

const FIRST_DAY_OPTIONS = Array.from({ length: 28 }, (_, index) => index + 1);

export interface SettingsProps {
  transactions: readonly Transaction[];
  settings: AppSettings;
  onSettingsChange: (patch: Partial<AppSettings>) => boolean;
  onImport: (backup: BackupData) => boolean;
  onClearData: () => boolean;
  onNotify: (message: string, tone?: ToastTone) => void;
}

function getExportDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(content: string, filename: string, type: string): void {
  let objectUrl: string | null = null;
  let link: HTMLAnchorElement | null = null;

  try {
    const blob = new Blob([content], { type });
    objectUrl = URL.createObjectURL(blob);
    link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    link.hidden = true;
    document.body.append(link);
    link.click();
  } finally {
    link?.remove();

    if (objectUrl) {
      const urlToRevoke = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(urlToRevoke), 1000);
    }
  }
}

function parseBudget(value: string): number | null {
  const normalizedValue = value.trim().replaceAll(/\s/g, '').replace(',', '.');

  if (!/^\d+(?:\.\d{0,2})?$/.test(normalizedValue)) {
    return null;
  }

  const numericValue = Number(normalizedValue);
  const minorUnits = Math.round(numericValue * 100);

  if (
    !Number.isFinite(numericValue) ||
    numericValue < 0 ||
    !Number.isSafeInteger(minorUnits)
  ) {
    return null;
  }

  return minorUnits / 100;
}

export default function Settings({
  transactions,
  settings,
  onSettingsChange,
  onImport,
  onClearData,
  onNotify,
}: SettingsProps) {
  const [budgetDraft, setBudgetDraft] = useState(String(settings.budget));
  const [budgetError, setBudgetError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBudgetDraft(String(settings.budget));
    setBudgetError('');
  }, [settings.budget]);

  const handleThemeChange = (theme: ThemePreference) => {
    onSettingsChange({ theme });
  };

  const handleCurrencyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const currency = CURRENCY_OPTIONS.find(
      (option) => option.value === event.currentTarget.value,
    )?.value;

    if (currency) {
      onSettingsChange({ currency });
    }
  };

  const handleFirstDayChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const firstDay = Number(event.currentTarget.value);

    if (Number.isInteger(firstDay) && firstDay >= 1 && firstDay <= 28) {
      onSettingsChange({ firstDay });
    }
  };

  const handleBudgetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const budget = parseBudget(budgetDraft);

    if (budget === null) {
      const message = 'Введите бюджет от 0 с точностью до двух знаков';
      setBudgetError(message);
      onNotify(message, 'error');
      return;
    }

    setBudgetDraft(String(budget));
    setBudgetError('');
    const saved = onSettingsChange({ budget });
    onNotify(
      saved
        ? budget === 0
          ? 'Лимит бюджета отключён'
          : 'Месячный бюджет сохранён'
        : 'Не удалось сохранить месячный бюджет',
      saved ? 'success' : 'error',
    );
  };

  const handleJsonExport = () => {
    try {
      const serializedBackup = serializeBackup(transactions, settings);
      downloadBlob(
        serializedBackup,
        `akcha-backup-${getExportDate()}.json`,
        'application/json;charset=utf-8',
      );
      onNotify('Резервная копия сохранена', 'success');
    } catch {
      onNotify('Не удалось экспортировать резервную копию', 'error');
    }
  };

  const handleCsvExport = () => {
    try {
      const csv = transactionsToCsv(transactions, settings.currency);
      downloadBlob(
        csv,
        `akcha-transactions-${getExportDate()}.csv`,
        'text/csv;charset=utf-8',
      );
      onNotify('CSV-файл сохранён', 'success');
    } catch {
      onNotify('Не удалось экспортировать CSV', 'error');
    }
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);

    try {
      if (file.size > MAX_BACKUP_SIZE) {
        onNotify('Файл резервной копии больше 2 МБ', 'error');
        return;
      }

      const rawBackup = await file.text();
      const parsedBackup = parseBackupJson(rawBackup);

      if (!parsedBackup.success) {
        onNotify(`Импорт отклонён: ${parsedBackup.error}`, 'error');
        return;
      }

      const shouldReplace = window.confirm(
        `Заменить текущие данные резервной копией? В ней ${parsedBackup.data.transactions.length} операций.`,
      );

      if (!shouldReplace) {
        return;
      }

      let imported = false;

      try {
        imported = onImport(parsedBackup.data);
      } catch {
        imported = false;
      }

      onNotify(
        imported
          ? 'Резервная копия импортирована'
          : 'Не удалось применить резервную копию',
        imported ? 'success' : 'error',
      );
    } catch {
      onNotify('Не удалось прочитать файл резервной копии', 'error');
    } finally {
      input.value = '';
      setIsImporting(false);
    }
  };

  const handleClearData = () => {
    const firstConfirmation = window.confirm(
      'Удалить все операции и сбросить настройки? Перед очисткой рекомендуется сохранить резервную копию.',
    );

    if (!firstConfirmation) {
      return;
    }

    const secondConfirmation = window.confirm(
      'Последнее подтверждение: удаление всех локальных данных нельзя отменить. Продолжить?',
    );

    if (!secondConfirmation) {
      return;
    }

    try {
      const cleared = onClearData();
      onNotify(
        cleared ? 'Локальные данные очищены' : 'Не удалось очистить данные',
        cleared ? 'success' : 'error',
      );
    } catch {
      onNotify('Не удалось очистить локальные данные', 'error');
    }
  };

  return (
    <div className="settings-screen app-screen">
      <header className="screen-header">
        <div className="screen-header__title">
          <h1>Настройки</h1>
          <p>Персонализация, данные и инструменты</p>
        </div>
      </header>

      <section
        className="settings-section card"
        aria-labelledby="appearance-settings-heading"
      >
        <header className="settings-section__heading">
          <span className="settings-section__heading-icon" aria-hidden="true">
            <Icon name="settings" size={21} />
          </span>
          <div>
            <h2 id="appearance-settings-heading">Внешний вид</h2>
            <p>Тема и валюта приложения</p>
          </div>
        </header>

        <div className="theme-selector" role="group" aria-label="Тема приложения">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.theme === option.value}
              onClick={() => handleThemeChange(option.value)}
            >
              <Icon name={option.icon} size={21} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-list">
          <label className="settings-row" htmlFor="settings-currency">
            <span className="settings-row__label">
              <strong>Валюта</strong>
              <span>Используется во всех суммах</span>
            </span>
            <select
              id="settings-currency"
              className="settings-select"
              value={settings.currency}
              onChange={handleCurrencyChange}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-row" htmlFor="settings-first-day">
            <span className="settings-row__label">
              <strong>Начало периода</strong>
              <span>Первый день расчётного месяца</span>
            </span>
            <select
              id="settings-first-day"
              className="settings-select"
              value={settings.firstDay}
              onChange={handleFirstDayChange}
            >
              {FIRST_DAY_OPTIONS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section
        className="settings-section card"
        aria-labelledby="budget-settings-heading"
      >
        <header className="settings-section__heading">
          <span className="settings-section__heading-icon" aria-hidden="true">
            <Icon name="wallet" size={21} />
          </span>
          <div>
            <h2 id="budget-settings-heading">Месячный бюджет</h2>
            <p id="budget-settings-help">Укажите 0, чтобы отключить лимит</p>
          </div>
        </header>

        <form className="budget-setting-form" onSubmit={handleBudgetSubmit}>
          <label className="sr-only" htmlFor="settings-budget">
            Месячный бюджет в валюте {settings.currency}
          </label>
          <input
            id="settings-budget"
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            maxLength={20}
            value={budgetDraft}
            aria-describedby="budget-settings-help budget-settings-error"
            aria-invalid={Boolean(budgetError)}
            placeholder={`Сумма, ${settings.currency}`}
            onChange={(event) => {
              setBudgetDraft(event.currentTarget.value);
              setBudgetError('');
            }}
          />
          <button type="submit" className="primary-button">
            Сохранить
          </button>
          <span
            id="budget-settings-error"
            className="sr-only"
            aria-live="polite"
          >
            {budgetError}
          </span>
        </form>
      </section>

      <section
        className="settings-section card"
        aria-labelledby="data-settings-heading"
      >
        <header className="settings-section__heading">
          <span className="settings-section__heading-icon" aria-hidden="true">
            <Icon name="download" size={21} />
          </span>
          <div>
            <h2 id="data-settings-heading">Данные</h2>
            <p>Резервная копия и экспорт операций</p>
          </div>
        </header>

        <div className="data-actions">
          <button type="button" className="data-action" onClick={handleJsonExport}>
            <Icon name="download" size={23} />
            <span>Экспорт JSON</span>
          </button>

          <button
            type="button"
            className="data-action"
            disabled={isImporting}
            onClick={() => importInputRef.current?.click()}
          >
            <Icon name="upload" size={23} />
            <span>{isImporting ? 'Проверка файла…' : 'Импорт JSON'}</span>
          </button>

          <input
            ref={importInputRef}
            type="file"
            className="import-input"
            accept="application/json,.json"
            aria-label="Выбрать резервную копию JSON"
            onChange={handleImportChange}
          />

          <button type="button" className="data-action" onClick={handleCsvExport}>
            <Icon name="transactions" size={23} />
            <span>Экспорт CSV</span>
          </button>

          <button
            type="button"
            className="data-action data-action--danger"
            onClick={handleClearData}
          >
            <Icon name="trash" size={23} />
            <span>Очистить данные</span>
          </button>
        </div>
      </section>

      <details
        className="settings-section card tools-disclosure"
        onToggle={(event) => setToolsOpen(event.currentTarget.open)}
      >
        <summary>
          <span className="settings-section__heading-icon" aria-hidden="true">
            <Icon name="calculator" size={21} />
          </span>
          <span>Инструменты · Калькулятор</span>
        </summary>

        {toolsOpen ? (
          <div className="tools-disclosure__content">
            <Suspense fallback={<div className="screen-loading">Загрузка калькулятора…</div>}>
              <LazyCalculator />
            </Suspense>
          </div>
        ) : null}
      </details>

      <section className="about-card card" aria-labelledby="about-akcha-heading">
        <img src="/logo.svg" alt="" aria-hidden="true" />
        <div>
          <h2 id="about-akcha-heading">Akcha</h2>
          <p>
            Личное финансовое приложение без аккаунта и сервера. Операции и
            настройки хранятся только на этом устройстве и никуда не отправляются.
            Сохраняйте резервные копии перед очисткой данных браузера.
          </p>
        </div>
      </section>
    </div>
  );
}
