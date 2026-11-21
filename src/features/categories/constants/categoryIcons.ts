import type { ComponentType } from 'react';
import {
  IconToolsKitchen2,
  IconCoffee,
  IconHome,
  IconCar,
  IconPlane,
  IconShoppingBag,
  IconBolt,
  IconWifi,
  IconBriefcase,
  IconDeviceLaptop,
  IconHeartbeat,
  IconBarbell,
  IconBook,
  IconGift,
  IconTrendingUp,
  IconMovie,
  IconReceiptRefund,
  IconPaw,
  IconShieldCheck,
  IconTag,
} from '@tabler/icons-react';

export interface TablerIconProps {
  className?: string;
  stroke?: number;
  size?: number | string;
}

export type CategoryIconComponent = ComponentType<TablerIconProps>;

export const CATEGORY_ICON_MAP = {
  utensils: IconToolsKitchen2,
  coffee: IconCoffee,
  home: IconHome,
  car: IconCar,
  plane: IconPlane,
  shopping: IconShoppingBag,
  bolt: IconBolt,
  wifi: IconWifi,
  briefcase: IconBriefcase,
  laptop: IconDeviceLaptop,
  health: IconHeartbeat,
  gym: IconBarbell,
  book: IconBook,
  gift: IconGift,
  trending: IconTrendingUp,
  movie: IconMovie,
  refund: IconReceiptRefund,
  paw: IconPaw,
  shield: IconShieldCheck,
  category: IconTag,
} as const satisfies Record<string, CategoryIconComponent>;

export type CategoryIconKey = keyof typeof CATEGORY_ICON_MAP;

export const DEFAULT_CUSTOM_CATEGORY_ICON: CategoryIconComponent = IconTag;

export const CATEGORY_ICON_LIST: {
  key: CategoryIconKey;
  label: string;
  icon: CategoryIconComponent;
}[] = [
  { key: 'utensils', label: 'Food & Dining', icon: CATEGORY_ICON_MAP.utensils },
  { key: 'coffee', label: 'Cafe & Tea', icon: CATEGORY_ICON_MAP.coffee },
  { key: 'home', label: 'Housing & Rent', icon: CATEGORY_ICON_MAP.home },
  { key: 'car', label: 'Transport & Fuel', icon: CATEGORY_ICON_MAP.car },
  { key: 'plane', label: 'Travel & Flights', icon: CATEGORY_ICON_MAP.plane },
  { key: 'shopping', label: 'Shopping', icon: CATEGORY_ICON_MAP.shopping },
  { key: 'bolt', label: 'Bills & Utilities', icon: CATEGORY_ICON_MAP.bolt },
  { key: 'wifi', label: 'Internet & Subscriptions', icon: CATEGORY_ICON_MAP.wifi },
  { key: 'briefcase', label: 'Salary & Work', icon: CATEGORY_ICON_MAP.briefcase },
  { key: 'laptop', label: 'Freelance & Tech', icon: CATEGORY_ICON_MAP.laptop },
  { key: 'health', label: 'Health & Medical', icon: CATEGORY_ICON_MAP.health },
  { key: 'gym', label: 'Gym & Fitness', icon: CATEGORY_ICON_MAP.gym },
  { key: 'book', label: 'Education', icon: CATEGORY_ICON_MAP.book },
  { key: 'gift', label: 'Bonus & Gifts', icon: CATEGORY_ICON_MAP.gift },
  { key: 'trending', label: 'Investments', icon: CATEGORY_ICON_MAP.trending },
  { key: 'movie', label: 'Entertainment', icon: CATEGORY_ICON_MAP.movie },
  { key: 'refund', label: 'Refunds', icon: CATEGORY_ICON_MAP.refund },
  { key: 'paw', label: 'Pets', icon: CATEGORY_ICON_MAP.paw },
  { key: 'shield', label: 'Insurance', icon: CATEGORY_ICON_MAP.shield },
  { key: 'category', label: 'Custom / General', icon: CATEGORY_ICON_MAP.category },
];

export function getCategoryIconComponent(key?: string): CategoryIconComponent {
  if (!key) return DEFAULT_CUSTOM_CATEGORY_ICON;
  const normalized = key.trim().toLowerCase() as CategoryIconKey;
  return CATEGORY_ICON_MAP[normalized] ?? DEFAULT_CUSTOM_CATEGORY_ICON;
}