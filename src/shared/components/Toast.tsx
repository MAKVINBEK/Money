import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons/Icon';
import './components.css';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'error';

export interface ToastProps {
  message: ReactNode;
  open?: boolean;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  duration?: number;
  dismissLabel?: string;
  className?: string;
}

export function Toast({
  message,
  open = true,
  tone = 'neutral',
  actionLabel,
  onAction,
  onDismiss,
  duration = 7000,
  dismissLabel = 'Закрыть уведомление',
  className,
}: ToastProps) {
  const [paused, setPaused] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!open || paused || duration <= 0 || !onDismissRef.current) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onDismissRef.current?.();
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [duration, open, paused]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const toastClassName = [
    'ui-toast',
    `ui-toast--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      className={toastClassName}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setPaused(false);
        }
      }}
    >
      <span className="ui-toast__message">{message}</span>

      {actionLabel && onAction ? (
        <button
          autoFocus
          type="button"
          className="ui-toast__action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}

      {onDismiss ? (
        <button
          type="button"
          className="ui-toast__dismiss"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <Icon name="close" size={19} />
        </button>
      ) : null}
    </div>,
    document.body,
  );
}
