import { useState, useCallback, useId } from 'react';
import { ChevronDown, Info, type LucideIcon } from 'lucide-react';

// Components
import { LocalTip, TipRow } from '../common';

// Utils
import { cn } from '@/utils';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  titleIcon?: LucideIcon;
  tips: LocalTip[];
}

export const CollapsibleSection = ({
  title,
  titleIcon: TitleIcon = Info,
  tips,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();
  const handleToggle = useCallback(() => setIsOpen((p) => !p), []);

  return (
    <div
      className={cn(
        'border-border-tertiary bg-background-primary overflow-hidden rounded-lg border',
        className
      )}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={handleToggle}
        className="hover:bg-background-secondary flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors"
      >
        <span className="text-body text-text-primary flex items-center gap-2 font-medium">
          <TitleIcon size={16} className="text-text-tertiary flex-shrink-0" aria-hidden="true" />
          {title}
        </span>
        <ChevronDown
          size={16}
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
        aria-label={title}
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {tips.length > 0 ? (
          <ul className="px-4 pb-3">
            {tips.map((tip, i) => (
              <TipRow key={i} text={tip.text} icon={tip.icon} />
            ))}
          </ul>
        ) : (
          <p className="text-body font-regular text-text-tertiary px-4 pb-3">No tips available.</p>
        )}
      </div>
    </div>
  );
};
