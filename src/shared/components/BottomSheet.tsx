import {
  useEffect,
  useId,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons/Icon';
import './components.css';

const FOCUSABLE_SELECTOR = [
  '[data-autofocus]',
  '[autofocus]',
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface BottomSheetProps {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  description?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hidden &&
      element.getAttribute('aria-hidden') !== 'true' &&
      !element.hasAttribute('disabled'),
  );
}

export function BottomSheet({
  open,
  title,
  children,
  onClose,
  description,
  footer,
  closeLabel = 'Закрыть',
  className,
  initialFocusRef,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    lastActiveElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const body = document.body;
    const root = document.documentElement;
    const visualViewport = window.visualViewport;
    const scrollTop = window.scrollY;
    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollTop}px`;
    body.style.width = '100%';

    const previousViewportStyles = {
      height: root.style.getPropertyValue('--akcha-visual-viewport-height'),
      top: root.style.getPropertyValue('--akcha-visual-viewport-top'),
    };
    const updateVisualViewport = () => {
      if (!visualViewport) {
        return;
      }

      root.style.setProperty(
        '--akcha-visual-viewport-height',
        `${visualViewport.height}px`,
      );
      root.style.setProperty(
        '--akcha-visual-viewport-top',
        `${visualViewport.offsetTop}px`,
      );
    };

    updateVisualViewport();
    visualViewport?.addEventListener('resize', updateVisualViewport);
    visualViewport?.addEventListener('scroll', updateVisualViewport);

    const focusFrame = window.requestAnimationFrame(() => {
      const explicitlyFocusedElement =
        sheetRef.current?.querySelector<HTMLElement>(
          '[data-autofocus], [autofocus]',
        );
      const focusTarget =
        initialFocusRef?.current ??
        explicitlyFocusedElement ??
        (sheetRef.current
          ? getFocusableElements(sheetRef.current)[0]
          : undefined) ??
        sheetRef.current;

      focusTarget?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !sheetRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(sheetRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        sheetRef.current.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!sheetRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      visualViewport?.removeEventListener('resize', updateVisualViewport);
      visualViewport?.removeEventListener('scroll', updateVisualViewport);

      body.style.overflow = previousBodyStyles.overflow;
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.width = previousBodyStyles.width;
      if (previousViewportStyles.height) {
        root.style.setProperty(
          '--akcha-visual-viewport-height',
          previousViewportStyles.height,
        );
      } else {
        root.style.removeProperty('--akcha-visual-viewport-height');
      }

      if (previousViewportStyles.top) {
        root.style.setProperty(
          '--akcha-visual-viewport-top',
          previousViewportStyles.top,
        );
      } else {
        root.style.removeProperty('--akcha-visual-viewport-top');
      }

      window.scrollTo(0, scrollTop);

      const lastActiveElement = lastActiveElementRef.current;
      if (lastActiveElement?.isConnected) {
        window.requestAnimationFrame(() => {
          lastActiveElement.focus({ preventScroll: true });
        });
      }
    };
  }, [initialFocusRef, open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const handleBackdropPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const sheetClassName = ['ui-bottom-sheet', className]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      className="ui-bottom-sheet-backdrop"
      onPointerDown={handleBackdropPointerDown}
    >
      <div
        ref={sheetRef}
        className={sheetClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <div className="ui-bottom-sheet__handle" aria-hidden="true" />

        <header className="ui-bottom-sheet__header">
          <div className="ui-bottom-sheet__heading">
            <h2 id={titleId}>{title}</h2>
            {description ? (
              <p id={descriptionId}>{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            className="ui-bottom-sheet__close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <Icon name="close" size={22} />
          </button>
        </header>

        <div className="ui-bottom-sheet__content">{children}</div>

        {footer ? (
          <footer className="ui-bottom-sheet__footer">{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
