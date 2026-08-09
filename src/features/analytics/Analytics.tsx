import type { CSSProperties } from 'react';
import { EmptyState } from '../../shared/components/EmptyState';
import { MonthSwitcher } from '../../shared/components/MonthSwitcher';
import { getCategory } from '../../shared/data/categories';
import { Icon } from '../../shared/icons/Icon';
import type { AppSettings, Transaction } from '../../shared/types/finance';
import {
  getBillingPeriodForMonth,
  isDateInRange,
} from '../../shared/utils/date';
import { calculateExpenseAnalytics } from '../../shared/utils/finance';
import {
  formatCurrency,
  formatPercentage,
  formatPeriod,
} from '../../shared/utils/format';
import './analytics.css';

export interface AnalyticsProps {
  transactions: readonly Transaction[];
  settings: AppSettings;
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
}

type CategoryColorStyle = CSSProperties & {
  '--category-color': string;
};

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

function formatCompactAmount(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getComparisonLabel(percentageChange: number | null): string {
  if (percentageChange === null) {
    return 'Ранее расходов не было';
  }

  if (percentageChange === 0) {
    return 'Без изменений';
  }

  return percentageChange > 0
    ? `На ${formatPercentage(percentageChange)} больше`
    : `На ${formatPercentage(Math.abs(percentageChange))} меньше`;
}

export default function Analytics({
  transactions,
  settings,
  selectedMonth,
  onMonthChange,
}: AnalyticsProps) {
  const period = getBillingPeriodForMonth(selectedMonth, settings.firstDay);
  const today = new Date();
  const analytics = calculateExpenseAnalytics(
    transactions,
    period,
    isDateInRange(today, period) ? today : undefined,
  );
  const topCategory = analytics.topCategory
    ? getCategory(analytics.topCategory.category, 'expense')
    : undefined;
  const comparisonMaximum = Math.max(
    analytics.comparison.current,
    analytics.comparison.previous,
    1,
  );
  const currentWidth = (analytics.comparison.current / comparisonMaximum) * 100;
  const previousWidth = (analytics.comparison.previous / comparisonMaximum) * 100;
  let donutOffset = 0;

  return (
    <section className="analytics-screen app-screen" aria-labelledby="analytics-title">
      <header className="screen-header">
        <div className="screen-header__title">
          <h1 id="analytics-title">Аналитика</h1>
          <p>{formatPeriod(period)}</p>
        </div>
      </header>

      <MonthSwitcher
        label={formatMonthLabel(selectedMonth)}
        onPrevious={() => onMonthChange(shiftMonth(selectedMonth, -1))}
        onNext={() => onMonthChange(shiftMonth(selectedMonth, 1))}
      />

      <div className="analytics-totals">
        <article className="analytics-total analytics-total--income card">
          <div className="analytics-total__top">
            <span className="analytics-total__icon" aria-hidden="true">
              <Icon name="income" size={18} />
            </span>
            <span>Доходы</span>
          </div>
          <strong>{formatCurrency(analytics.totals.income, settings.currency)}</strong>
        </article>

        <article className="analytics-total analytics-total--expense card">
          <div className="analytics-total__top">
            <span className="analytics-total__icon" aria-hidden="true">
              <Icon name="expense" size={18} />
            </span>
            <span>Расходы</span>
          </div>
          <strong>{formatCurrency(analytics.totals.expenses, settings.currency)}</strong>
        </article>
      </div>

      {analytics.categoryShares.length === 0 ? (
        <EmptyState
          title="Нет расходов за период"
          description="Когда появятся расходы, здесь будет разбивка по категориям."
          icon="analytics"
        />
      ) : (
        <section className="analytics-chart-card card" aria-labelledby="category-chart-heading">
          <h2 id="category-chart-heading">Расходы по категориям</h2>

          <div className="donut-layout">
            <svg
              className="donut-chart"
              viewBox="0 0 100 100"
              role="img"
              aria-label={`Расходы за период: ${formatCurrency(analytics.totals.expenses, settings.currency)}`}
            >
              <circle
                cx="50"
                cy="50"
                r="37"
                fill="none"
                stroke="var(--color-surface-muted)"
                strokeWidth="14"
                aria-hidden="true"
              />
              {analytics.categoryShares.map((share) => {
                const category = getCategory(share.category, 'expense');
                const startOffset = donutOffset;
                donutOffset += share.percentage;

                return (
                  <circle
                    key={share.category}
                    cx="50"
                    cy="50"
                    r="37"
                    fill="none"
                    stroke={category?.color ?? '#64748B'}
                    strokeWidth="14"
                    pathLength="100"
                    strokeDasharray={`${share.percentage} ${Math.max(0, 100 - share.percentage)}`}
                    strokeDashoffset={-startOffset}
                    transform="rotate(-90 50 50)"
                    aria-hidden="true"
                  />
                );
              })}
              <text x="50" y="49" className="donut-chart__total">
                {formatCompactAmount(analytics.totals.expenses)}
              </text>
              <text x="50" y="59" className="donut-chart__label">
                {settings.currency}
              </text>
            </svg>

            <ul className="category-breakdown">
              {analytics.categoryShares.map((share) => {
                const category = getCategory(share.category, 'expense');
                const style: CategoryColorStyle = {
                  '--category-color': category?.color ?? '#64748B',
                };

                return (
                  <li key={share.category} className="category-breakdown__row">
                    <span
                      className="category-breakdown__dot"
                      style={style}
                      aria-hidden="true"
                    />
                    <span className="category-breakdown__name">
                      {category?.label ?? 'Другое'}
                    </span>
                    <span className="category-breakdown__value">
                      <strong>{formatPercentage(share.percentage)}</strong>
                      {formatCurrency(share.amount, settings.currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <div className="analytics-insights">
        <article className="insight-card card">
          <span className="insight-card__icon" aria-hidden="true">
            <Icon name="calendar" size={19} />
          </span>
          <span>Средний расход в день</span>
          <strong>{formatCurrency(analytics.averagePerDay, settings.currency)}</strong>
        </article>

        <article className="insight-card card">
          <span className="insight-card__icon" aria-hidden="true">
            <Icon name="analytics" size={19} />
          </span>
          <span>Самая затратная категория</span>
          <strong>{topCategory?.label ?? 'Нет данных'}</strong>
        </article>
      </div>

      <section className="analytics-chart-card card" aria-labelledby="comparison-heading">
        <div className="section-heading">
          <h2 id="comparison-heading">Сравнение расходов</h2>
          <span className="category-breakdown__value">
            {getComparisonLabel(analytics.comparison.percentageChange)}
          </span>
        </div>

        <div className="comparison-bar">
          <div className="comparison-bar__row">
            <span>Текущий</span>
            <div className="comparison-bar__track" aria-hidden="true">
              <div
                className="comparison-bar__value"
                style={{ width: `${currentWidth}%` }}
              />
            </div>
            <strong>{formatCurrency(analytics.comparison.current, settings.currency)}</strong>
          </div>

          <div className="comparison-bar__row">
            <span>Прошлый</span>
            <div className="comparison-bar__track" aria-hidden="true">
              <div
                className="comparison-bar__value"
                style={{ width: `${previousWidth}%` }}
              />
            </div>
            <strong>{formatCurrency(analytics.comparison.previous, settings.currency)}</strong>
          </div>
        </div>
      </section>
    </section>
  );
}
