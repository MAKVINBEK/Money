import type { CurrencyCode, Transaction } from '../../shared/types/finance';
import { toDateKey } from '../../shared/utils/date';
import { sortTransactionsNewestFirst } from '../../shared/utils/finance';
import { formatDate } from '../../shared/utils/format';
import { TransactionRow } from './TransactionRow';

interface TransactionListProps {
  transactions: readonly Transaction[];
  currency: CurrencyCode;
  onEdit: (transaction: Transaction) => void;
  grouped?: boolean;
}

interface TransactionGroup {
  dateKey: string;
  transactions: Transaction[];
}

function groupByDate(transactions: readonly Transaction[]): TransactionGroup[] {
  const groups = new Map<string, Transaction[]>();

  for (const transaction of sortTransactionsNewestFirst(transactions)) {
    const dateKey = toDateKey(transaction.createdAt);
    const group = groups.get(dateKey);

    if (group) {
      group.push(transaction);
    } else {
      groups.set(dateKey, [transaction]);
    }
  }

  return Array.from(groups, ([dateKey, groupedTransactions]) => ({
    dateKey,
    transactions: groupedTransactions,
  }));
}

function formatGroupDate(dateKey: string): string {
  const todayKey = toDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey === todayKey) {
    return 'Сегодня';
  }

  if (dateKey === toDateKey(yesterday)) {
    return 'Вчера';
  }

  return formatDate(dateKey, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function TransactionList({
  transactions,
  currency,
  onEdit,
  grouped = true,
}: TransactionListProps) {
  if (!grouped) {
    return (
      <ul className="transaction-list">
        {sortTransactionsNewestFirst(transactions).map((transaction) => (
          <li key={transaction.id}>
            <TransactionRow
              transaction={transaction}
              currency={currency}
              onEdit={onEdit}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="transaction-groups">
      {groupByDate(transactions).map((group) => (
        <section className="transaction-group" key={group.dateKey}>
          <h2 className="transaction-group__title">
            <span>{formatGroupDate(group.dateKey)}</span>
            <span>{group.transactions.length}</span>
          </h2>

          <ul className="transaction-list">
            {group.transactions.map((transaction) => (
              <li key={transaction.id}>
                <TransactionRow
                  transaction={transaction}
                  currency={currency}
                  onEdit={onEdit}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
