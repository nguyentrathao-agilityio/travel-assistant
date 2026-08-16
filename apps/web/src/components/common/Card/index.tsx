// components/common/Card/index.tsx
import { cn } from '@/utils';
import type { ReactNode } from 'react';

interface CardProps {
  isSelected?: boolean;
  paddingClass?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/** Base card surface. */
const Card = ({
  isSelected = false,
  paddingClass = 'px-5 py-4',
  children,
  className,
  onClick,
}: CardProps) => (
  <div
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    className={cn(
      'card-typography rounded-lg transition-colors',
      paddingClass,
      isSelected
        ? 'border-border-info bg-background-info border-2'
        : 'border-border-tertiary bg-background-primary border-2',
      onClick && 'cursor-pointer',
      className
    )}
  >
    {children}
  </div>
);

export { Card };
