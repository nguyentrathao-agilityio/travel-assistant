import {
  Building2,
  Leaf,
  Tag,
  TrendingUp,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// Utils
import { cn } from '@/utils';

export type BadgeVariant = 'success' | 'primary' | 'warning' | 'secondary' | 'accent' | 'danger';

export const BADGE_CLASS_MAP: Record<BadgeVariant, string> = {
  success: 'bg-badge-success-bg text-badge-success-text',
  primary: 'bg-badge-primary-bg text-badge-primary-text',
  warning: 'bg-badge-warning-bg text-badge-warning-text',
  secondary: 'bg-badge-secondary-bg text-badge-secondary-text',
  accent: 'bg-badge-accent-bg text-badge-accent-text',
  danger: 'bg-badge-danger-bg text-badge-danger-text',
};

export const BADGE_ICON_MAP: Record<BadgeVariant, LucideIcon> = {
  success: Tag,
  primary: TrendingUp,
  warning: Zap,
  secondary: Leaf,
  accent: Building2,
  danger: UtensilsCrossed,
};

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  showIcon?: boolean;
  className?: string;
}

export const Badge = ({ variant, label, showIcon = true, className }: BadgeProps) => {
  const Icon = BADGE_ICON_MAP[variant];

  return (
    <span
      className={cn(
        'rounded-pill text-badge font-small inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-0.5',
        BADGE_CLASS_MAP[variant],
        className
      )}
    >
      {showIcon && <Icon size={11} aria-hidden="true" />}
      {label}
    </span>
  );
};
