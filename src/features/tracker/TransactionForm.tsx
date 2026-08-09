import { useState, type FormEvent } from 'react';
import type {
  CreateTransaction,
  TransactionType,
} from './tracker.types';

interface TransactionFormProps {
  onSubmit: (transaction: CreateTransaction) => void;
}

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericAmount = Number(amount);
    const normalizedDescription = description.trim();

    if (
      !normalizedDescription ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return;
    }

    onSubmit({
      description: normalizedDescription,
      amount: numericAmount,
      type,
    });

    setDescription('');
    setAmount('');
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={description}
        placeholder="Например: продукты"
        maxLength={100}
        required
        onChange={(event) => setDescription(event.target.value)}
      />

      <div className="transaction-form__row">
        <select
          value={type}
          aria-label="Тип операции"
          onChange={(event) =>
            setType(event.target.value as TransactionType)
          }
        >
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>

        <input
          type="number"
          value={amount}
          placeholder="Сумма"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          required
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <button type="submit">Добавить операцию</button>
    </form>
  );
}