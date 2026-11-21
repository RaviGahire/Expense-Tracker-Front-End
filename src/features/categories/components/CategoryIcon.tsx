import type { ReactNode } from 'react';
import {
  IconToolsKitchen2 ,
  IconHome,
  IconCar,
  IconShoppingBag,
  IconBolt,
  IconBriefcase,
  IconDeviceLaptop,
  IconHeartbeat,
  IconBook,
  IconGift,
  IconTrendingUp,
  IconMovie,
  IconReceiptRefund,
  IconPlane,
  IconBarbell,
  IconWifi,
  IconCoffee,
  IconPaw,
  IconShieldCheck,
  IconTag,
} from '@tabler/icons-react';


export type CategoryFlowType = 'expense' | 'income';

export type CategoryColorToken =
  | 'brand'
  | 'income'
  | 'expense'
  | 'warning'
  | 'accent'
  | 'neutral';

export type CategoryIconSize = 'xs' | 'sm' | 'md' | 'lg';

export interface CategoryIconProps {
  name?: string;
  label?: string;
  type?: CategoryFlowType;
  color?: CategoryColorToken;
  size?: CategoryIconSize;
  showWrapper?: boolean;
  useMonogramFallback?: boolean;
  className?: string;
}

const COLOR_TOKEN_STYLES: Record<CategoryColorToken, string> = {
  brand: 'bg-brand/15 text-brand',
  income: 'bg-income/15 text-income',
  expense: 'bg-expense/15 text-expense',
  warning: 'bg-warning/15 text-warning',
  accent: 'bg-accent/15 text-accent',
  neutral: 'bg-surface-elevated text-ink-secondary',
};

const SIZE_STYLES: Record<
  CategoryIconSize,
  { wrapper: string; icon: string; monogram: string }
> = {
  xs: { wrapper: 'h-6 w-6 rounded-lg', icon: 'h-3.5 w-3.5', monogram: 'text-[10px]' },
  sm: { wrapper: 'h-8 w-8 rounded-lg', icon: 'h-4 w-4', monogram: 'text-xs' },
  md: { wrapper: 'h-10 w-10 rounded-xl', icon: 'h-4 w-4', monogram: 'text-xs' },
  lg: { wrapper: 'h-11 w-11 rounded-xl', icon: 'h-5 w-5', monogram: 'text-sm' },
};

export function resolveCategoryColorToken(
  key: string,
  type?: CategoryFlowType,
  explicitColor?: CategoryColorToken
): CategoryColorToken {
  if (explicitColor) return explicitColor;
  if (type === 'income') return 'income';

  const normalized = key.trim().toLowerCase();
  if (
    normalized.includes('food') ||
    normalized.includes('utensil') ||
    normalized.includes('dining') ||
    normalized.includes('coffee') ||
    normalized.includes('bolt') ||
    normalized.includes('bill') ||
    normalized.includes('utilit')
  ) {
    return 'warning';
  }
  if (
    normalized.includes('home') ||
    normalized.includes('rent') ||
    normalized.includes('housing') ||
    normalized.includes('book') ||
    normalized.includes('educat') ||
    normalized.includes('shield') ||
    normalized.includes('insur')
  ) {
    return 'brand';
  }
  if (
    normalized.includes('car') ||
    normalized.includes('transport') ||
    normalized.includes('fuel') ||
    normalized.includes('plane') ||
    normalized.includes('travel') ||
    normalized.includes('movie') ||
    normalized.includes('entertain') ||
    normalized.includes('wifi') ||
    normalized.includes('subscri')
  ) {
    return 'accent';
  }
  if (
    normalized.includes('shop') ||
    normalized.includes('health') ||
    normalized.includes('medical') ||
    normalized.includes('gym') ||
    normalized.includes('fitness')
  ) {
    return 'expense';
  }

  return 'neutral';
}

function getInitialMonogram(label?: string): string | null {
  if (!label) return null;
  const words = label
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return null;
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function CategoryIcon({
  name,
  label,
  type = 'expense',
  color,
  size = 'md',
  showWrapper = true,
  useMonogramFallback = false,
  className = '',
}: CategoryIconProps) {
  const lookupKey = (name || label || '').trim().toLowerCase();
  const resolvedColor = resolveCategoryColorToken(lookupKey, type, color);
  const badgeClass = COLOR_TOKEN_STYLES[resolvedColor];
  const dimensions = SIZE_STYLES[size];
  const iconClass = dimensions.icon;

  let glyph: ReactNode | null = null;

  if (lookupKey.includes('utensil') || lookupKey.includes('food') || lookupKey.includes('dining')) {
    glyph = <IconToolsKitchen2 className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('coffee') || lookupKey.includes('cafe') || lookupKey.includes('tea')) {
    glyph = <IconCoffee className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('home') || lookupKey.includes('rent') || lookupKey.includes('housing')) {
    glyph = <IconHome className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('car') || lookupKey.includes('transport') || lookupKey.includes('fuel')) {
    glyph = <IconCar className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('plane') || lookupKey.includes('travel') || lookupKey.includes('flight')) {
    glyph = <IconPlane className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('shop')) {
    glyph = <IconShoppingBag className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('bolt') || lookupKey.includes('bill') || lookupKey.includes('utilit')) {
    glyph = <IconBolt className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('wifi') || lookupKey.includes('internet') || lookupKey.includes('subscri')) {
    glyph = <IconWifi className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('briefcase') || lookupKey.includes('salary')) {
    glyph = <IconBriefcase className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('laptop') || lookupKey.includes('freelance')) {
    glyph = <IconDeviceLaptop className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('health') || lookupKey.includes('medical')) {
    glyph = <IconHeartbeat className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('gym') || lookupKey.includes('fitness') || lookupKey.includes('barbell')) {
    glyph = <IconBarbell className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('book') || lookupKey.includes('educat')) {
    glyph = <IconBook className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('gift') || lookupKey.includes('bonus')) {
    glyph = <IconGift className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('trend') || lookupKey.includes('invest')) {
    glyph = <IconTrendingUp className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('movie') || lookupKey.includes('entertain')) {
    glyph = <IconMovie className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('refund')) {
    glyph = <IconReceiptRefund className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('pet') || lookupKey.includes('paw')) {
    glyph = <IconPaw className={iconClass} stroke={1.75} />;
  } else if (lookupKey.includes('shield') || lookupKey.includes('insur')) {
    glyph = <IconShieldCheck className={iconClass} stroke={1.75} />;
  }

  // Fallback for custom categories without a dedicated icon match
  if (!glyph) {
    const monogram = useMonogramFallback ? getInitialMonogram(label) : null;
    glyph = monogram ? (
      <span className={`font-bold tracking-tight select-none ${dimensions.monogram}`}>
        {monogram}
      </span>
    ) : (
      <IconTag className={iconClass} stroke={1.75} />
    );
  }

  if (!showWrapper) {
    return <span className={`inline-flex items-center justify-center ${className}`}>{glyph}</span>;
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center ${dimensions.wrapper} ${badgeClass} ${className}`}
    >
      {glyph}
    </span>
  );
}