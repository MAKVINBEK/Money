import { useState } from 'react';
import './calculator.css';

type Operator = '+' | '−' | '×' | '÷';

function calculate(
  firstValue: number,
  secondValue: number,
  operator: Operator,
): number | null {
  switch (operator) {
    case '+':
      return firstValue + secondValue;

    case '−':
      return firstValue - secondValue;

    case '×':
      return firstValue * secondValue;

    case '÷':
      return secondValue === 0 ? null : firstValue / secondValue;
  }
}

function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Ошибка';
  }

  return Number.parseFloat(value.toPrecision(12)).toString();
}

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const clear = () => {
    setDisplay('0');
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const inputDigit = (digit: string) => {
    if (display === 'Ошибка' || waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
      return;
    }

    setDisplay((currentDisplay) =>
      currentDisplay === '0' ? digit : currentDisplay + digit,
    );
  };

  const inputDecimal = () => {
    if (display === 'Ошибка' || waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }

    if (!display.includes('.')) {
      setDisplay((currentDisplay) => `${currentDisplay}.`);
    }
  };

  const toggleSign = () => {
    if (display === '0' || display === 'Ошибка') {
      return;
    }

    setDisplay((currentDisplay) =>
      currentDisplay.startsWith('-')
        ? currentDisplay.slice(1)
        : `-${currentDisplay}`,
    );
  };

  const removeLastCharacter = () => {
    if (display === 'Ошибка' || waitingForOperand) {
      setDisplay('0');
      return;
    }

    setDisplay((currentDisplay) => {
      if (
        currentDisplay.length === 1 ||
        (currentDisplay.length === 2 && currentDisplay.startsWith('-'))
      ) {
        return '0';
      }

      return currentDisplay.slice(0, -1);
    });
  };

  const chooseOperator = (nextOperator: Operator) => {
    const inputValue = Number(display);

    if (!Number.isFinite(inputValue)) {
      clear();
      return;
    }

    if (storedValue !== null && operator && !waitingForOperand) {
      const result = calculate(storedValue, inputValue, operator);

      if (result === null) {
        setDisplay('Ошибка');
        setStoredValue(null);
        setOperator(null);
        setWaitingForOperand(true);
        return;
      }

      const formattedResult = formatResult(result);

      setDisplay(formattedResult);
      setStoredValue(result);
    } else {
      setStoredValue(inputValue);
    }

    setOperator(nextOperator);
    setWaitingForOperand(true);
  };

  const handleEqual = () => {
    if (storedValue === null || operator === null || waitingForOperand) {
      return;
    }

    const inputValue = Number(display);
    const result = calculate(storedValue, inputValue, operator);

    if (result === null) {
      setDisplay('Ошибка');
    } else {
      setDisplay(formatResult(result));
    }

    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  return (
    <section className="calculator">
      <div className="calculator__display" aria-live="polite">
        {display}
      </div>

      <div className="calculator__buttons">
        <button type="button" className="calculator__action" onClick={clear}>
          AC
        </button>

        <button
          type="button"
          className="calculator__action"
          onClick={toggleSign}
        >
          +/−
        </button>

        <button
          type="button"
          className="calculator__action"
          onClick={removeLastCharacter}
          aria-label="Удалить последний символ"
        >
          ⌫
        </button>

        <button
          type="button"
          className="calculator__operator"
          onClick={() => chooseOperator('÷')}
          aria-label="Разделить"
          aria-pressed={operator === '÷'}
        >
          ÷
        </button>

        {['7', '8', '9'].map((digit) => (
          <button type="button" key={digit} onClick={() => inputDigit(digit)}>
            {digit}
          </button>
        ))}

        <button
          type="button"
          className="calculator__operator"
          onClick={() => chooseOperator('×')}
          aria-label="Умножить"
          aria-pressed={operator === '×'}
        >
          ×
        </button>

        {['4', '5', '6'].map((digit) => (
          <button type="button" key={digit} onClick={() => inputDigit(digit)}>
            {digit}
          </button>
        ))}

        <button
          type="button"
          className="calculator__operator"
          onClick={() => chooseOperator('−')}
          aria-label="Вычесть"
          aria-pressed={operator === '−'}
        >
          −
        </button>

        {['1', '2', '3'].map((digit) => (
          <button type="button" key={digit} onClick={() => inputDigit(digit)}>
            {digit}
          </button>
        ))}

        <button
          type="button"
          className="calculator__operator"
          onClick={() => chooseOperator('+')}
          aria-label="Сложить"
          aria-pressed={operator === '+'}
        >
          +
        </button>

        <button
          type="button"
          className="calculator__zero"
          onClick={() => inputDigit('0')}
        >
          0
        </button>

        <button type="button" onClick={inputDecimal}>
          .
        </button>

        <button
          type="button"
          className="calculator__equal"
          onClick={handleEqual}
          aria-label="Равно"
        >
          =
        </button>
      </div>
    </section>
  );
}
