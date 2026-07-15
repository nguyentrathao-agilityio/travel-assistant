import { useCallback } from 'react';

// Utils
import { cn } from '@/utils';

// Components
import { Button } from '@/components';

interface CollapsedThreadButtonProps {
  id: string;
  title: string;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export const CollapsedThreadButton = ({
  id,
  title,
  isActive,
  onSelect,
}: CollapsedThreadButtonProps) => {
  const handleSelect = useCallback(() => onSelect(id), [id, onSelect]);

  return (
    <Button
      variant="ghost"
      title={title}
      onClick={handleSelect}
      className={cn(
        'mb-0.5 h-8 w-8 p-0',
        isActive ? 'bg-sidebar-item-active' : 'hover:bg-sidebar-item-hover'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isActive ? 'bg-sidebar-dot-active' : 'bg-sidebar-dot-idle'
        )}
        aria-hidden="true"
      />
    </Button>
  );
};
