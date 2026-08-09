import { useId, type ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';
import './components.css';

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'wallet',
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const titleId = useId();
  const emptyStateClassName = ['ui-empty-state', className]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={emptyStateClassName} aria-labelledby={titleId}>
      <span className="ui-empty-state__icon" aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <h2 id={titleId}>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
