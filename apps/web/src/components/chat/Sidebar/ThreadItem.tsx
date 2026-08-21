import { useCallback } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { KeyboardEvent, MouseEvent } from 'react';

import { cn } from '@/utils';
import { Button } from '@/components';

export interface ThreadItemProps {
  id: string;
  title: string | null;
  date?: string;
  isActive: boolean;
  onSelect: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ThreadItem = ({
  id,
  title,
  isActive,
  onSelect,
  onReset,
  onDelete,
}: ThreadItemProps) => {
  const handleSelect = useCallback(() => onSelect(id), [id, onSelect]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') onSelect(id);
    },
    [id, onSelect]
  );

  const handleReset = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onReset(id);
    },
    [id, onReset]
  );

  const handleDelete = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onDelete(id);
    },
    [id, onDelete]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative mx-2 mb-0.5 flex cursor-pointer items-start gap-3 rounded-lg border-l-2 px-3 py-3 transition-colors',
        isActive
          ? 'bg-sidebar-item-active border-brand-500'
          : 'hover:bg-sidebar-item-hover border-transparent'
      )}
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-semibold',
            isActive ? 'text-sidebar-text' : 'text-sidebar-text-muted'
          )}
        >
          {title || 'New chat'}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-1 group-hover:flex">
        {title && (
          <Button
            variant="ghost"
            aria-label="Reset conversation"
            onClick={handleReset}
            className="text-sidebar-text-muted hover:text-sidebar-text p-0.5 hover:bg-transparent"
          >
            <RotateCcw size={12} />
          </Button>
        )}
        <Button
          variant="ghost"
          aria-label="Delete conversation"
          onClick={handleDelete}
          className="text-sidebar-text-muted hover:text-sidebar-text p-0.5 hover:bg-transparent"
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
};
