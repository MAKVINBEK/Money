import type {
  CategoryId,
  ExpenseCategoryId,
  IncomeCategoryId,
  TransactionType,
} from '../types/finance';

export type CategoryIconName =
  | 'groceries'
  | 'transport'
  | 'home'
  | 'cafe'
  | 'shopping'
  | 'health'
  | 'subscriptions'
  | 'entertainment'
  | 'transfers'
  | 'salary'
  | 'freelance'
  | 'gift'
  | 'refund'
  | 'transfer'
  | 'other';

export interface CategoryDefinition<TId extends CategoryId = CategoryId> {
  id: TId;
  type: TransactionType;
  label: string;
  color: string;
  icon: CategoryIconName;
}

export const EXPENSE_CATEGORIES = [
  { id: 'groceries', type: 'expense', label: 'Продукты', color: '#F97316', icon: 'groceries' },
  { id: 'transport', type: 'expense', label: 'Транспорт', color: '#3B82F6', icon: 'transport' },
  { id: 'home', type: 'expense', label: 'Дом', color: '#8B5CF6', icon: 'home' },
  { id: 'cafe', type: 'expense', label: 'Кафе', color: '#F59E0B', icon: 'cafe' },
  { id: 'shopping', type: 'expense', label: 'Покупки', color: '#EC4899', icon: 'shopping' },
  { id: 'health', type: 'expense', label: 'Здоровье', color: '#EF4444', icon: 'health' },
  { id: 'subscriptions', type: 'expense', label: 'Подписки', color: '#6366F1', icon: 'subscriptions' },
  { id: 'entertainment', type: 'expense', label: 'Развлечения', color: '#A855F7', icon: 'entertainment' },
  { id: 'transfers', type: 'expense', label: 'Переводы', color: '#0EA5E9', icon: 'transfers' },
  { id: 'other', type: 'expense', label: 'Другое', color: '#64748B', icon: 'other' },
] as const satisfies readonly CategoryDefinition<ExpenseCategoryId>[];

export const INCOME_CATEGORIES = [
  { id: 'salary', type: 'income', label: 'Зарплата', color: '#16A34A', icon: 'salary' },
  { id: 'side-income', type: 'income', label: 'Подработка', color: '#22C55E', icon: 'freelance' },
  { id: 'gift', type: 'income', label: 'Подарок', color: '#14B8A6', icon: 'gift' },
  { id: 'refund', type: 'income', label: 'Возврат', color: '#10B981', icon: 'refund' },
  { id: 'transfer', type: 'income', label: 'Перевод', color: '#06B6D4', icon: 'transfer' },
  { id: 'other', type: 'income', label: 'Другое', color: '#64748B', icon: 'other' },
] as const satisfies readonly CategoryDefinition<IncomeCategoryId>[];

export const CATEGORIES_BY_TYPE = {
  expense: EXPENSE_CATEGORIES,
  income: INCOME_CATEGORIES,
} as const;

export const getCategoriesByType = (type: TransactionType) => CATEGORIES_BY_TYPE[type];

export function isCategoryForType(
  category: unknown,
  type: TransactionType,
): category is CategoryId {
  return CATEGORIES_BY_TYPE[type].some((item) => item.id === category);
}

export function getCategory(
  category: CategoryId,
  type: TransactionType,
): CategoryDefinition | undefined {
  return CATEGORIES_BY_TYPE[type].find((item) => item.id === category);
}
