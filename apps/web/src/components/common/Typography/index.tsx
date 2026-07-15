import { type ElementType, type ReactNode, type ComponentPropsWithoutRef } from 'react';

// Utils
import { cn } from '@/utils';

const variantClasses = {
  display: 'text-display',
  heading: 'text-heading',
  'card-title': 'text-card-title',
  'option-title': 'text-option-title',
  body: 'text-body',
  meta: 'text-meta',
  label: 'text-label',
  badge: 'text-badge',
};

const weightClasses = {
  regular: 'font-regular',
  medium: 'font-medium',
};

const colorClasses = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
};

export type TypographyVariant = keyof typeof variantClasses;
export type TypographyWeight = keyof typeof weightClasses;
export type TypographyColor = keyof typeof colorClasses;

type TypographyProps<T extends ElementType = 'p'> = {
  as?: T;
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: TypographyColor;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

/**
 * Polymorphic text primitive. Renders any element via `as` with design-token
 * variant, weight, and color props.
 */
const Typography = <T extends ElementType = 'p'>({
  as,
  variant = 'body',
  weight = 'regular',
  color = 'primary',
  className,
  children,
  ...rest
}: TypographyProps<T>) => {
  const Component = as ?? 'p';

  return (
    <Component
      className={cn(variantClasses[variant], weightClasses[weight], colorClasses[color], className)}
      {...rest}
    >
      {children}
    </Component>
  );
};

export { Typography };
