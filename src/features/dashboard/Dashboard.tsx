import type { CSSProperties } from 'react';
import { EmptyState } from '../../shared/components/EmptyState';
import { MonthSwitcher } from '../../shared/components/MonthSwitcher';
import { getCategory } from '../../shared/data/categories';
import { Icon, type IconName } from '../../shared/icons/Icon';
import type {
  AppSettings,
  CategoryId,
  Transaction,
} from '../../shared/types/finance';
import { getBillingPeriodForMonth } from '../../shared/utils/date';
import {
  calculateAllTimeTotals,
  calculateDayTotals,
  calculatePeriodTotals,
  sortTransactionsNewestFirst,
} from '../../shared/utils/finance';
import { formatCurrency, formatDate } from '../../shared/utils/format';
import '../transactions/transactions.css';
import './dashboard.css';

export interface DashboardProps {
  transactions: readonly Transaction[];
  settings: AppSettings;
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
  onAdd: () => void;
  onShowAll: () => void;
  onEdit: (transaction: Transaction) => void;
  onToggleBalance: () => void;
}

const CATEGORY_ICONS: Record<CategoryId, IconName> = {
  groceries: 'groceries',
  transport: 'transport',
  home: 'home',
  cafe: 'cafe',
  shopping: 'shopping',
  health: 'health',
  subscriptions: 'subscriptions',
  entertainment: 'entertainment',
  transfers: 'transfers',
  salary: 'salary',
  'side-income': 'freelance',
  gift: 'gift',
  refund: 'refund',
  transfer: 'transfer',
  other: 'other',
};

type CategoryColorStyle = CSSProperties & {
  '--category-color': string;
};

function getCategoryColorStyle(color?: string): CategoryColorStyle {
  return { '--category-color': color ?? '#64748B' };
}

function shiftMonth(month: Date, offset: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

function formatMonthLabel(month: Date): string {
  const label = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(month);

  return `${label.charAt(0).toLocaleUpperCase('ru-RU')}${label.slice(1)}`;
}

export default function Dashboard({
  transactions,
  settings,
  selectedMonth,
  onMonthChange,
  onAdd,
  onShowAll,
  onEdit,
  onToggleBalance,
}: DashboardProps) {
  const period = getBillingPeriodForMonth(selectedMonth, settings.firstDay);
  const allTimeTotals = calculateAllTimeTotals(transactions);
  const monthTotals = calculatePeriodTotals(transactions, period);
  const todayExpenses = calculateDayTotals(transactions, new Date()).expenses;
  const recentTransactions = sortTransactionsNewestFirst(transactions).slice(0, 5);
  const hasBudget = Number.isFinite(settings.budget) && settings.budget > 0;
  const budgetPercentage = hasBudget
    ? Math.max(0, (monthTotals.expenses / settings.budget) * 100)
    : 0;
  const budgetProgress = Math.min(budgetPercentage, 100);
  const isOverBudget = hasBudget && monthTotals.expenses > settings.budget;

  return (
    <section className="dashboard app-screen" aria-labelledby="dashboard-title">
      <header className="screen-header">
        <div className="dashboard__brand">
          <img
            className="dashboard__logo"
            src="/logo.svg"
            width="42"
            height="42"
            alt=""
          />
          <div>
            <h1 id="dashboard-title">Akcha</h1>
            <span>Личные финансы</span>
          </div>
        </div>
      </header>

      <MonthSwitcher
        label={formatMonthLabel(selectedMonth)}
        onPrevious={() => onMonthChange(shiftMonth(selectedMonth, -1))}
        onNext={() => onMonthChange(shiftMonth(selectedMonth, 1))}
      />

      <section className="balance-card" aria-labelledby="balance-heading">
        <div className="balance-card__top">
          <h2 id="balance-heading" className="balance-card__label">
            Общий баланс
          </h2>
          <button
            type="button"
            className="balance-card__visibility"
            aria-label={settings.balanceHidden ? 'Показать баланс' : 'Скрыть баланс'}
            aria-pressed={settings.balanceHidden}
            onClick={onToggleBalance}
          >
            <Icon name={settings.balanceHidden ? 'eye' : 'eye-off'} size={21} />
          </button>
        </div>

        {settings.balanceHidden ? (
          <div
            className="balance-card__amount balance-card__hidden"
            aria-label="Баланс скрыт"
          >
            ••••••
          </div>
        ) : (
          <div className="balance-card__amount">
            {formatCurrency(allTimeTotals.balance, settings.currency)}
          </div>
        )}

        <div className="balance-card__totals">
          <div className="balance-card__total">
            <span className="balance-card__total-icon" aria-hidden="true">
              <Icon name="income" size={20} />
            </span>
            <div>
              <span>Доходы за период</span>
              <strong>{formatCurrency(monthTotals.income, settings.currency)}</strong>
            </div>
          </div>

          <div className="balance-card__total">
            <span className="balance-card__total-icon" aria-hidden="true">
              <Icon name="expense" size={20} />
            </span>
            <div>
              <span>Расходы за период</span>
              <strong>{formatCurrency(monthTotals.expenses, settings.currency)}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard__summary-grid">
        <article className="mini-summary card">
          <span className="mini-summary__icon" aria-hidden="true">
            <Icon name="calendar" size={20} />
          </span>
          <span className="mini-summary__label">Расходы сегодня</span>
          <strong>{formatCurrency(todayExpenses, settings.currency)}</strong>
        </article>

        <article className="mini-summary card">
          <span className="mini-summary__icon" aria-hidden="true">
            <Icon name="wallet" size={20} />
          </span>
          <span className="mini-summary__label">Баланс за период</span>
          <strong>{formatCurrency(monthTotals.balance, settings.currency)}</strong>
        </article>
      </div>

      <section
        className={`budget-card card${isOverBudget ? ' budget-card--over' : ''}`}
        aria-labelledby="budget-heading"
      >
        <div className="budget-card__top">
          <div>
            <span id="budget-heading">Месячный бюджет</span>
            <strong>
              {hasBudget
                ? `${formatCurrency(monthTotals.expenses, settings.currency)} из ${formatCurrency(settings.budget, settings.currency)}`
                : 'Лимит не задан'}
            </strong>
          </div>
          <span className="budget-card__percent">
            {hasBudget ? `${Math.round(budgetPercentage)}%` : '—'}
          </span>
        </div>

        <div
          className="budget-progress"
          role={hasBudget ? 'progressbar' : undefined}
          aria-label={hasBudget ? 'Использовано месячного бюджета' : undefined}
          aria-valuemin={hasBudget ? 0 : undefined}
          aria-valuemax={hasBudget ? 100 : undefined}
          aria-valuenow={hasBudget ? Math.round(budgetProgress) : undefined}
        >
          <div
            className="budget-progress__value"
            style={{ width: `${budgetProgress}%` }}
          />
        </div>

        {!hasBudget ? (
          <p className="budget-card__message">Укажите лимит в настройках.</p>
        ) : null}
        {isOverBudget ? (
          <p className="budget-card__message">
            Бюджет превышен на{' '}
            {formatCurrency(monthTotals.expenses - settings.budget, settings.currency)}.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="recent-transactions-heading">
        <div className="section-heading">
          <h2 id="recent-transactions-heading">Последние операции</h2>
          {transactions.length > 0 ? (
            <button type="button" className="section-link" onClick={onShowAll}>
              Показать все
            </button>
          ) : null}
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            title="Пока нет операций"
            description="Добавьте первый доход или расход — сводка обновится сразу."
            icon="transactions"
          />
        ) : (
          <ul className="transaction-list">
            {recentTransactions.map((transaction) => {
              const category = getCategory(transaction.category, transaction.type);
              const categoryLabel = category?.label ?? 'Другое';
              const amountPrefix = transaction.type === 'income' ? '+' : '−';

              return (
                <li key={transaction.id}>
                  <button
                    type="button"
                    className="transaction-row"
                    onClick={() => onEdit(transaction)}
                  >
                    <span className="sr-only">Редактировать операцию: </span>
                    <span
                      className="transaction-row__icon"
                      style={getCategoryColorStyle(category?.color)}
                      aria-hidden="true"
                    >
                      <Icon name={CATEGORY_ICONS[transaction.category]} size={21} />
                    </span>
                    <span className="transaction-row__main">
                      <strong>{transaction.description || categoryLabel}</strong>
                      <span>
                        {categoryLabel} ·{' '}
                        {formatDate(transaction.createdAt, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                    <strong
                      className={`transaction-row__amount transaction-row__amount--${transaction.type}`}
                    >
                      {amountPrefix}{formatCurrency(transaction.amount, settings.currency)}
                    </strong>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <button
        type="button"
        className="primary-button dashboard__quick-add"
        onClick={onAdd}
      >
        <Icon name="plus" size={21} />
        Добавить операцию
      </button>
    </section>
  );
}
