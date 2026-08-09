import type { CSSProperties } from 'react';
import { getCategory } from '../../shared/data/categories';
import { Icon } from '../../shared/icons/Icon';
import type { CurrencyCode, Transaction } from '../../shared/types/finance';
import { formatCurrency } from '../../shared/utils/format';

interface TransactionRowProps {
  transaction: Transaction;
  currency: CurrencyCode;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionRow({
  transaction,
  currency,
  onEdit,
}: TransactionRowProps) {
  const category = getCategory(transaction.category, transaction.type);
  const isIncome = transaction.type === 'income';
  const categoryLabel = category?.label ?? 'Другое';
  const categoryColor = category?.color ?? '#64748B';
  const iconName = category?.icon ?? 'other';
  const label = transaction.description || categoryLabel;
  const rowStyle = {
    '--category-color': categoryColor,
  } as CSSProperties;

  return (
    <button
      type="button"
      className="transaction-row"
      style={rowStyle}
      onClick={() => onEdit(transaction)}
    >
      <span className="sr-only">Редактировать операцию: </span>
      <span className="transaction-row__icon" aria-hidden="true">
        <Icon name={iconName} size={21} />
      </span>

      <span className="transaction-row__main">
        <strong>{label}</strong>
        <span>{categoryLabel}</span>
      </span>

      <strong
        className={`transaction-row__amount transaction-row__amount--${
          isIncome ? 'income' : 'expense'
        }`}
      >
        {isIncome ? '+' : '−'}
        {formatCurrency(transaction.amount, currency)}
      </strong>
    </button>
  );
}
