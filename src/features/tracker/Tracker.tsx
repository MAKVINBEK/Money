import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { formatMoney } from './tracker.utils';
import { useTransactions } from './useTransactions';
import './tracker.css';

export function Tracker() {
  const {
    transactions,
    totals,
    addTransaction,
    deleteTransaction,
    clearTransactions,
  } = useTransactions();

  const handleClear = () => {
    if (transactions.length === 0) {
      return;
    }

    const shouldClear = window.confirm(
      'Ты точно хочешь удалить все операции?',
    );

    if (shouldClear) {
      clearTransactions();
    }
  };

  return (
    <section className="tracker">
      <div className="summary-card">
        <span className="summary-card__label">Текущий баланс</span>
        <h1>{formatMoney(totals.balance)}</h1>

        <div className="summary-card__details">
          <div>
            <span>Доходы</span>
            <strong className="summary-card__income">
              +{formatMoney(totals.income)}
            </strong>
          </div>

          <div>
            <span>Расходы</span>
            <strong className="summary-card__expense">
              −{formatMoney(totals.expenses)}
            </strong>
          </div>
        </div>
      </div>

      <TransactionForm onSubmit={addTransaction} />

      <div className="tracker__header">
        <h2>История операций</h2>

        {transactions.length > 0 && (
          <button type="button" onClick={handleClear}>
            Очистить
          </button>
        )}
      </div>

      <TransactionList
        transactions={transactions}
        onDelete={deleteTransaction}
      />
    </section>
  );
}