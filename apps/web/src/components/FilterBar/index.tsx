import { memo, useCallback } from 'react';

// Components
import { FilterChip, FilterOption } from '../common/FilterChip';

// Utils
import { cn } from '@/utils';

interface FilterBarProps {
  filters: ReadonlyArray<FilterOption>;
  activeFilter: string;
  onChange: (value: string) => void;
  className?: string;
}

export const FilterBar = memo(({ filters, activeFilter, onChange, className }: FilterBarProps) => {
  const handleSelect = useCallback((v: string) => onChange(v), [onChange]);

  return (
    <div role="group" className={cn('flex flex-wrap gap-1.5', className)}>
      {filters.map((f) => (
        <FilterChip
          key={f.value}
          option={f}
          isActive={activeFilter === f.value}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
});
