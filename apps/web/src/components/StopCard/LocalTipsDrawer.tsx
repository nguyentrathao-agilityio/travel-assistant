import { ChevronDown } from 'lucide-react';
import { useCallback, useId, useState } from 'react';

// Constants
import { TIP_CATEGORY_CLASS_MAP } from '@/constants';

// Utils
import { cn } from '@/utils';

// Types
import type { Tip } from '@repo/types';

export interface TipsState {
  tips: Tip[];
  errorMessage?: string | null;
  onOpen?: () => void;
}

interface LocalTipsDrawerProps extends TipsState {
  stopName: string;
}

const LocalTipsDrawer = ({ stopName, tips, onOpen }: LocalTipsDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) onOpen?.();
      return !prev;
    });
  }, [onOpen]);

  return (
    <div className="border-border-tertiary mt-3 overflow-hidden rounded-md border">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={handleToggle}
        className="hover:bg-background-secondary flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors"
      >
        <span className="text-meta text-text-secondary font-regular">Local tips</span>
        <ChevronDown
          size={14}
          className={cn(
            'text-text-tertiary flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      <div
        id={contentId}
        role="region"
        aria-label={`Local tips for ${stopName}`}
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {tips.length > 0 && (
          <ul className="px-4 pb-3">
            {tips.map((tip) => (
              <li key={tip.id} className="border-border-tertiary border-b py-2.5 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-body text-text-primary font-medium">{tip.title}</p>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    {tip.isEssential && (
                      <span className="bg-badge-warning-bg text-badge-warning-text text-badge rounded-pill px-2 py-0.5 font-medium">
                        essential
                      </span>
                    )}
                    <span
                      className={cn(
                        'text-badge rounded-pill px-2 py-0.5 font-medium',
                        TIP_CATEGORY_CLASS_MAP[tip.category]
                      )}
                    >
                      {tip.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-meta font-regular text-text-secondary mt-0.5 leading-relaxed">
                  {tip.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export { LocalTipsDrawer };
