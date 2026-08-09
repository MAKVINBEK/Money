import { useState, type CSSProperties, type FormEvent } from 'react';
import {
  getCategoriesByType,
  isCategoryForType,
} from '../../shared/data/categories';
import { Icon } from '../../shared/icons/Icon';
import type {
  AppSettings,
  CategoryId,
  Transaction,
  TransactionInput,
  TransactionType,
} from '../../shared/types/finance';
import { toDateKey } from '../../shared/utils/date';
import { normalizePositiveAmount } from '../../shared/utils/finance';

interface TransactionSheetProps {
  transaction: Transaction | null;
  settings: AppSettings;
  onSubmit: (input: TransactionInput) => void;
  onDelete: (transaction: Transaction) => void;
  onCancel: () => void;
}

function normalizeDateInput(dateInput: string): string | null {
  const parts = dateInput.split('-').map(Number);

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts;
  const localDate = new Date(year, month - 1, day, 12);

  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day
  ) {
    return null;
  }

  return dateInput;
}

function dismissKeyboard(): void {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export function TransactionSheet({
  transaction,
  settings,
  onSubmit,
  onDelete,
  onCancel,
}: TransactionSheetProps) {
  const initialType = transaction?.type ?? 'expense';
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : '',
  );
  const [category, setCategory] = useState<CategoryId>(
    transaction?.category ?? getCategoriesByType(initialType)[0].id,
  );
  const [description, setDescription] = useState(
    transaction?.description ?? '',
  );
  const [date, setDate] = useState(
    toDateKey(transaction?.createdAt ?? new Date()),
  );
  const [error, setError] = useState('');
  const categories = getCategoriesByType(type);
  const isEditing = transaction !== null;

  const selectType = (nextType: TransactionType) => {
    setType(nextType);
    setError('');

    if (!isCategoryForType(category, nextType)) {
      setCategory(getCategoriesByType(nextType)[0].id);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedAmount = normalizePositiveAmount(amount);
    const normalizedDescription = description.trim();
    const selectedDate = normalizeDateInput(date);

    if (normalizedAmount === null) {
      setError('Введите сумму больше нуля');
      return;
    }

    if (!selectedDate || !isCategoryForType(category, type)) {
      setError('Проверьте дату и категорию операции');
      return;
    }

    const createdAt =
      transaction && toDateKey(transaction.createdAt) === date
        ? transaction.createdAt
        : selectedDate;

    dismissKeyboard();
    onSubmit({
      amount: normalizedAmount,
      type,
      category,
      description: normalizedDescription,
      createdAt,
    });
  };

  return (
    <form className="transaction-sheet-form" onSubmit={handleSubmit}>
      <div
        className="transaction-type-toggle"
        role="group"
        aria-label="Тип операции"
      >
        <button
          type="button"
          data-type="expense"
          aria-pressed={type === 'expense'}
          onClick={() => selectType('expense')}
        >
          Расход
        </button>
        <button
          type="button"
          data-type="income"
          aria-pressed={type === 'income'}
          onClick={() => selectType('income')}
        >
          Доход
        </button>
      </div>

      <label>
        <span className="sr-only">Сумма</span>
        <span className="amount-input-wrap">
          <input
            autoFocus
            data-autofocus
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            placeholder="0"
            maxLength={16}
            aria-describedby={error ? 'transaction-error' : undefined}
            onChange={(event) => {
              setAmount(event.target.value);
              setError('');
            }}
          />
          <span>{settings.currency}</span>
        </span>
      </label>

      <fieldset>
        <legend className="field-label">Категория</legend>
        <div className="category-picker">
          {categories.map((item) => {
            const style = { '--category-color': item.color } as CSSProperties;

            return (
              <button
                type="button"
                className="category-option"
                style={style}
                key={item.id}
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
              >
                <span className="category-option__icon" aria-hidden="true">
                  <Icon name={item.icon} size={20} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="transaction-sheet-form__grid">
        <label className="field">
          <span>Описание</span>
          <input
            type="text"
            value={description}
            maxLength={120}
            placeholder="Необязательно"
            autoComplete="off"
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Дата</span>
          <input
            type="date"
            value={date}
            required
            onChange={(event) => {
              setDate(event.target.value);
              setError('');
            }}
          />
        </label>
      </div>

      {error ? (
        <p className="field-error" id="transaction-error" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className={`transaction-sheet-actions${
          isEditing ? ' transaction-sheet-actions--edit' : ''
        }`}
      >
        {isEditing ? (
          <button
            type="button"
            className="danger-button"
            onClick={() => {
              dismissKeyboard();
              onDelete(transaction);
            }}
          >
            <Icon name="trash" size={19} />
            Удалить
          </button>
        ) : (
          <button type="button" className="ghost-button" onClick={onCancel}>
            Отмена
          </button>
        )}

        <button type="submit" className="primary-button">
          {isEditing ? 'Сохранить' : 'Добавить'}
        </button>

        {isEditing ? (
          <button type="button" className="ghost-button" onClick={onCancel}>
            Отмена
          </button>
        ) : null}
      </div>
    </form>
  );
}
