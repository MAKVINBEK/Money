import type { Transaction } from './tracker.types';
import { formatDate, formatMoney } from './tracker.utils';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export function TransactionList({
  transactions,
  onDelete,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <p>Операций пока нет</p>
        <span>Добавь первый доход или расход</span>
      </div>
    );
  }

  return (
    <ul className="transaction-list">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === 'income';

        return (
          <li
            key={transaction.id}
            className={`transaction-item ${
              isIncome ? 'transaction-item--income' : 'transaction-item--expense'
            }`}
          >
            <div className="transaction-item__content">
              <strong>{transaction.description}</strong>
              <span>{formatDate(transaction.createdAt)}</span>
            </div>

            <div className="transaction-item__right">
              <span className="transaction-item__amount">
                {isIncome ? '+' : '−'}
                {formatMoney(transaction.amount)}
              </span>

              <button
                type="button"
                aria-label={`Удалить операцию ${transaction.description}`}
                onClick={() => onDelete(transaction.id)}
              >
                ×
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}