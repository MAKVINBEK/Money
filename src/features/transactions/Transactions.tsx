import { useMemo, useState } from 'react';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoriesByType,
} from '../../shared/data/categories';
import { EmptyState } from '../../shared/components/EmptyState';
import { MonthSwitcher } from '../../shared/components/MonthSwitcher';
import { Icon } from '../../shared/icons/Icon';
import type {
  AppSettings,
  CategoryId,
  Transaction,
  TransactionType,
} from '../../shared/types/finance';
import {
  getBillingPeriodForMonth,
  isDateInRange,
} from '../../shared/utils/date';
import { calculateTotals } from '../../shared/utils/finance';
import {
  formatCurrency,
  formatDate,
  formatPeriod,
} from '../../shared/utils/format';
import { TransactionList } from './TransactionList';
import './transactions.css';

type TypeFilter = 'all' | TransactionType;
type CategoryFilter = 'all' | CategoryId;

interface TransactionsProps {
  transactions: readonly Transaction[];
  settings: AppSettings;
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
}

function shiftMonth(month: Date, offset: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

function getMonthLabel(month: Date, firstDay: number): string {
  const period = getBillingPeriodForMonth(month, firstDay);

  return firstDay === 1
    ? formatDate(month, { month: 'long', year: 'numeric' })
    : formatPeriod(period);
}

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].filter(
  (category, index, categories) =>
    categories.findIndex((item) => item.id === category.id) === index,
);

export default function Transactions({
  transactions,
  settings,
  selectedMonth,
  onMonthChange,
  onEdit,
  onAdd,
}: TransactionsProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>('all');
  const period = useMemo(
    () => getBillingPeriodForMonth(selectedMonth, settings.firstDay),
    [selectedMonth, settings.firstDay],
  );
  const categories =
    typeFilter === 'all' ? ALL_CATEGORIES : getCategoriesByType(typeFilter);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');

    return transactions.filter((transaction) => {
      if (!isDateInRange(transaction.createdAt, period)) {
        return false;
      }

      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }

      if (
        categoryFilter !== 'all' &&
        transaction.category !== categoryFilter
      ) {
        return false;
      }

      return (
        !normalizedQuery ||
        transaction.description.toLocaleLowerCase('ru-RU').includes(normalizedQuery)
      );
    });
  }, [categoryFilter, period, query, transactions, typeFilter]);

  const totals = calculateTotals(filteredTransactions);
  const filteredAmount =
    typeFilter === 'income'
      ? totals.income
      : typeFilter === 'expense'
        ? -totals.expenses
        : totals.balance;

  const changeTypeFilter = (nextFilter: TypeFilter) => {
    setTypeFilter(nextFilter);

    if (
      categoryFilter !== 'all' &&
      nextFilter !== 'all' &&
      !getCategoriesByType(nextFilter).some(
        (category) => category.id === categoryFilter,
      )
    ) {
      setCategoryFilter('all');
    }
  };

  return (
    <section className="transactions-screen app-screen">
      <header className="screen-header">
        <div className="screen-header__title">
          <h1>Операции</h1>
          <p>История доходов и расходов</p>
        </div>
      </header>

      <MonthSwitcher
        label={getMonthLabel(selectedMonth, settings.firstDay)}
        onPrevious={() => onMonthChange(shiftMonth(selectedMonth, -1))}
        onNext={() => onMonthChange(shiftMonth(selectedMonth, 1))}
      />

      <div className="transaction-filters card">
        <label className="search-field">
          <span className="sr-only">Поиск по описанию</span>
          <Icon name="search" size={19} />
          <input
            type="search"
            value={query}
            placeholder="Поиск по описанию"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="search-field__clear"
              aria-label="Очистить поиск"
              onClick={() => setQuery('')}
            >
              <Icon name="close" size={18} />
            </button>
          ) : null}
        </label>

        <div
          className="type-filter"
          role="group"
          aria-label="Фильтр по типу операции"
        >
          {(
            [
              ['all', 'Все'],
              ['income', 'Доходы'],
              ['expense', 'Расходы'],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={typeFilter === value}
              onClick={() => changeTypeFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="filter-row">
          <label>
            <span className="sr-only">Категория</span>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as CategoryFilter)
              }
            >
              <option value="all">Все категории</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setQuery('');
              setTypeFilter('all');
              setCategoryFilter('all');
            }}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="filtered-total" aria-live="polite">
        <span>{filteredTransactions.length} операций</span>
        <strong>{formatCurrency(filteredAmount, settings.currency)}</strong>
      </div>

      {filteredTransactions.length > 0 ? (
        <TransactionList
          transactions={filteredTransactions}
          currency={settings.currency}
          onEdit={onEdit}
        />
      ) : (
        <EmptyState
          icon="transactions"
          title="Ничего не найдено"
          description="Измените фильтры или добавьте новую операцию"
          actionLabel="Добавить операцию"
          onAction={onAdd}
        />
      )}
    </section>
  );
}
