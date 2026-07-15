import { memo, useCallback } from 'react';
import { type LucideIcon } from 'lucide-react';

import { cn } from '@/utils';

export interface FilterOption {
  value: string | 'all';
  label: string;
  icon?: LucideIcon;
  count?: number;
}

export const FilterChip = memo(
  ({
    option,
    isActive,
    onSelect,
  }: {
    option: FilterOption;
    isActive: boolean;
    onSelect: (v: string) => void;
  }) => {
    const handleClick = useCallback(() => onSelect(option.value), [onSelect, option.value]);
    const Icon = option.icon;

    return (
      <button
        type="button"
        aria-pressed={isActive}
        onClick={handleClick}
        className={cn(
          'rounded-pill inline-flex items-center gap-1.5 border px-3 py-1.5',
          'text-meta font-medium transition-colors duration-150',
          isActive
            ? 'border-text-primary bg-text-primary text-background-primary'
            : 'border-border-secondary bg-background-primary text-text-secondary hover:bg-background-secondary'
        )}
      >
        {Icon && <Icon size={14} aria-hidden="true" />}
        {option.label}
        {option.count !== undefined && (
          <span
            className={cn(
              'rounded-pill px-1.5 py-0.5 text-[10px] font-medium',
              isActive
                ? 'bg-background-primary/20 text-background-primary'
                : 'bg-background-secondary text-text-tertiary'
            )}
          >
            {option.count}
          </span>
        )}
      </button>
    );
  }
);
