import { ReactNode } from 'react';

// Utils
import { cn } from '@/utils';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children?: ReactNode;
}

const Divider = ({ orientation = 'horizontal', className, children }: DividerProps) => {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('bg-border-tertiary mx-2 inline-block h-full w-px align-middle', className)}
      />
    );
  }

  if (children) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cn('flex w-full items-center', className)}
      >
        <div className="bg-border-tertiary h-px flex-1" />
        <div className="text-body font-regular text-text-tertiary px-4">{children}</div>
        <div className="bg-border-tertiary h-px flex-1" />
      </div>
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn('bg-border-tertiary h-px w-full', className)}
    />
  );
};

export { Divider, type DividerProps };
