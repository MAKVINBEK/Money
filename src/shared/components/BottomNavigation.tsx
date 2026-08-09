import { Icon, type IconName } from '../icons/Icon';
import './components.css';

export type AppScreen =
  | 'dashboard'
  | 'transactions'
  | 'analytics'
  | 'settings';

export interface BottomNavigationProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onAdd: () => void;
  labels?: Partial<Record<AppScreen, string>>;
  addLabel?: string;
  navigationLabel?: string;
  className?: string;
}

interface NavigationItem {
  screen: AppScreen;
  label: string;
  icon: IconName;
}

const navigationItems: NavigationItem[] = [
  { screen: 'dashboard', label: 'Главная', icon: 'dashboard' },
  { screen: 'transactions', label: 'Операции', icon: 'transactions' },
  { screen: 'analytics', label: 'Аналитика', icon: 'analytics' },
  { screen: 'settings', label: 'Настройки', icon: 'settings' },
];

export function BottomNavigation({
  activeScreen,
  onNavigate,
  onAdd,
  labels,
  addLabel = 'Добавить',
  navigationLabel = 'Основная навигация',
  className,
}: BottomNavigationProps) {
  const navClassName = ['ui-bottom-navigation', className]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={navClassName} aria-label={navigationLabel}>
      {navigationItems.slice(0, 2).map((item) => {
        const label = labels?.[item.screen] ?? item.label;
        const isActive = item.screen === activeScreen;

        return (
          <button
            key={item.screen}
            type="button"
            className={`ui-bottom-navigation__item${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(item.screen)}
          >
            <Icon name={item.icon} size={22} />
            <span>{label}</span>
          </button>
        );
      })}

      <button
        type="button"
        className="ui-bottom-navigation__item ui-bottom-navigation__add"
        aria-label={addLabel}
        onClick={onAdd}
      >
        <span className="ui-bottom-navigation__add-icon" aria-hidden="true">
          <Icon name="plus" size={28} />
        </span>
        <span className="ui-bottom-navigation__add-label" aria-hidden="true">
          {addLabel}
        </span>
      </button>

      {navigationItems.slice(2).map((item) => {
        const label = labels?.[item.screen] ?? item.label;
        const isActive = item.screen === activeScreen;

        return (
          <button
            key={item.screen}
            type="button"
            className={`ui-bottom-navigation__item${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(item.screen)}
          >
            <Icon name={item.icon} size={22} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
