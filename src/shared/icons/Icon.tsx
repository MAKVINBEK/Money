import { useId, type ReactNode, type SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'transactions'
  | 'analytics'
  | 'settings'
  | 'plus'
  | 'chevron-left'
  | 'chevron-right'
  | 'close'
  | 'eye'
  | 'eye-off'
  | 'search'
  | 'filter'
  | 'calendar'
  | 'edit'
  | 'trash'
  | 'undo'
  | 'download'
  | 'upload'
  | 'calculator'
  | 'wallet'
  | 'check'
  | 'warning'
  | 'info'
  | 'sun'
  | 'moon'
  | 'system'
  | 'food'
  | 'groceries'
  | 'transport'
  | 'home'
  | 'cafe'
  | 'shopping'
  | 'health'
  | 'subscriptions'
  | 'entertainment'
  | 'transfer'
  | 'transfers'
  | 'other'
  | 'salary'
  | 'freelance'
  | 'gift'
  | 'refund'
  | 'income'
  | 'expense'
  | 'basket'
  | 'bus'
  | 'coffee'
  | 'shopping-bag'
  | 'heart'
  | 'repeat'
  | 'gamepad'
  | 'arrows-horizontal'
  | 'briefcase'
  | 'coins'
  | 'rotate-counter-clockwise'
  | 'arrow-down-left'
  | 'more-horizontal';

export interface IconProps
  extends Omit<SVGProps<SVGSVGElement>, 'name' | 'children'> {
  name: IconName;
  size?: number | string;
  /** Makes a standalone icon accessible. Omit it for decorative icons. */
  title?: string;
}

const foodIcon = (
  <>
    <path d="M6 3v7a2 2 0 0 0 2 2h1V3M6 7h3M8 12v9" />
    <path d="M15 3v18M15 3c2.2 0 4 2.2 4 5v3h-4" />
  </>
);

const transferIcon = (
  <>
    <path d="M4 7h14" />
    <path d="m15 4 3 3-3 3" />
    <path d="M20 17H6" />
    <path d="m9 14-3 3 3 3" />
  </>
);

const iconPaths: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </>
  ),
  transactions: (
    <>
      <path d="M5 4h14v16H5z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3.1 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  'eye-off': (
    <>
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A9 9 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.1 2.8M6.2 6.2C3.8 7.8 2.5 12 2.5 12s3.5 6 9.5 6a9 9 0 0 0 3-.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8Z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  edit: (
    <>
      <path d="M13.5 6.5 17.5 10.5M4 20l4.5-1 10-10a2.8 2.8 0 0 0-4-4l-10 10Z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
    </>
  ),
  undo: (
    <>
      <path d="m9 7-5 5 5 5" />
      <path d="M5 12h8a6 6 0 0 1 6 6v1" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V3M7 8l5-5 5 5M4 21h16" />
    </>
  ),
  calculator: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8v4H8zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2Z" />
      <path d="M4 8h16M15 12h7v5h-7a2.5 2.5 0 0 1 0-5Z" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  warning: (
    <>
      <path d="M10.3 4.2 2.7 18a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 9 9 0 1 0 20.5 15.5Z" />,
  system: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  food: foodIcon,
  groceries: foodIcon,
  transport: (
    <>
      <path d="M5 17V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v10" />
      <path d="M5 13h14M7 20v-3M17 20v-3M8 8h8M8 16h.01M16 16h.01" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10M9 21v-6h6v6" />
    </>
  ),
  cafe: (
    <>
      <path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6Z" />
      <path d="M17 10h1a3 3 0 0 1 0 6h-2M7 3v2M11 3v2M15 3v2" />
    </>
  ),
  shopping: (
    <>
      <path d="M5 8h14l-1 13H6Z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  health: (
    <>
      <path d="M12 21S4 16 4 9a4 4 0 0 1 7-2.6L12 7.5l1-1.1A4 4 0 0 1 20 9c0 7-8 12-8 12Z" />
      <path d="M9 12h6M12 9v6" />
    </>
  ),
  subscriptions: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10 9 5 3-5 3Z" />
    </>
  ),
  entertainment: (
    <>
      <path d="M8 10h8M12 6v8" />
      <path d="M7 5h10a5 5 0 0 1 4.7 6.7l-1.8 5a3 3 0 0 1-5 1.1L13.2 16h-2.4l-1.7 1.8a3 3 0 0 1-5-1.1l-1.8-5A5 5 0 0 1 7 5Z" />
      <path d="M17 10h.01M19 12h.01" />
    </>
  ),
  transfer: transferIcon,
  transfers: transferIcon,
  other: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  salary: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M8 6V4h8v2M3 11h18M10 15h4" />
    </>
  ),
  freelance: (
    <>
      <path d="M4 20h16M6 20l1-9h10l1 9M9 11V8a3 3 0 0 1 6 0v3" />
      <path d="M10 15h4" />
    </>
  ),
  gift: (
    <>
      <path d="M3 10h18v11H3zM2 6h20v4H2zM12 6v15" />
      <path d="M12 6H8.5A2.5 2.5 0 1 1 11 3.5ZM12 6h3.5A2.5 2.5 0 1 0 13 3.5Z" />
    </>
  ),
  refund: (
    <>
      <path d="m8 7-4 4 4 4" />
      <path d="M4 11h9a6 6 0 0 1 6 6v2" />
    </>
  ),
  income: (
    <>
      <path d="M12 21V4M6 10l6-6 6 6" />
    </>
  ),
  expense: (
    <>
      <path d="M12 3v17M6 14l6 6 6-6" />
    </>
  ),
  basket: (
    <>
      <path d="M4 10h16l-2 10H6Z" />
      <path d="m8 10 4-6 4 6M9 14v2M15 14v2" />
    </>
  ),
  bus: (
    <>
      <path d="M5 17V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v10" />
      <path d="M5 13h14M7 20v-3M17 20v-3M8 8h8M8 16h.01M16 16h.01" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6Z" />
      <path d="M17 10h1a3 3 0 0 1 0 6h-2M7 3v2M11 3v2M15 3v2" />
    </>
  ),
  'shopping-bag': (
    <>
      <path d="M5 8h14l-1 13H6Z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  heart: (
    <>
      <path d="M12 21S4 16 4 9a4 4 0 0 1 7-2.6L12 7.5l1-1.1A4 4 0 0 1 20 9c0 7-8 12-8 12Z" />
      <path d="M9 12h6M12 9v6" />
    </>
  ),
  repeat: (
    <>
      <path d="M17 2.5 21 6l-4 3.5" />
      <path d="M3 11V9a3 3 0 0 1 3-3h15M7 21.5 3 18l4-3.5" />
      <path d="M21 13v2a3 3 0 0 1-3 3H3" />
    </>
  ),
  gamepad: (
    <>
      <path d="M8 10h8M12 6v8" />
      <path d="M7 5h10a5 5 0 0 1 4.7 6.7l-1.8 5a3 3 0 0 1-5 1.1L13.2 16h-2.4l-1.7 1.8a3 3 0 0 1-5-1.1l-1.8-5A5 5 0 0 1 7 5Z" />
      <path d="M17 10h.01M19 12h.01" />
    </>
  ),
  'arrows-horizontal': transferIcon,
  briefcase: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M8 6V4h8v2M3 11h18M10 15h4" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="7" rx="5" ry="3" />
      <path d="M4 7v4c0 1.7 2.2 3 5 3 1.1 0 2.1-.2 3-.6M4 11v4c0 1.7 2.2 3 5 3" />
      <path d="M12 10.6c.8-.4 1.8-.6 3-.6 2.8 0 5 1.3 5 3s-2.2 3-5 3-5-1.3-5-3M10 13v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4" />
    </>
  ),
  'rotate-counter-clockwise': (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  'arrow-down-left': (
    <>
      <path d="M19 5 5 19M5 9v10h10" />
    </>
  ),
  'more-horizontal': (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
};

export function Icon({
  name,
  size = 24,
  title,
  strokeWidth = 1.8,
  ...svgProps
}: IconProps) {
  const titleId = useId();

  return (
    <svg
      {...svgProps}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-labelledby={title ? titleId : undefined}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {iconPaths[name]}
    </svg>
  );
}
