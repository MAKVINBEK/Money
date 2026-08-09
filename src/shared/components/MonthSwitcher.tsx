import { Icon } from '../icons/Icon';
import './components.css';

export interface MonthSwitcherProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  groupLabel?: string;
  className?: string;
}

export function MonthSwitcher({
  label,
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  previousLabel = 'Предыдущий месяц',
  nextLabel = 'Следующий месяц',
  groupLabel = 'Выбор месяца',
  className,
}: MonthSwitcherProps) {
  const switcherClassName = ['ui-month-switcher', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={switcherClassName} role="group" aria-label={groupLabel}>
      <button
        type="button"
        aria-label={previousLabel}
        disabled={previousDisabled}
        onClick={onPrevious}
      >
        <Icon name="chevron-left" size={22} />
      </button>

      <span className="ui-month-switcher__label" aria-live="polite" aria-atomic="true">
        {label}
      </span>

      <button
        type="button"
        aria-label={nextLabel}
        disabled={nextDisabled}
        onClick={onNext}
      >
        <Icon name="chevron-right" size={22} />
      </button>
    </div>
  );
}
