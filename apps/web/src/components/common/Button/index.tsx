import { memo } from 'react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

// Utils
import { cn } from '@/utils';

// Constants
import { BUTTON_VARIANT_MAP, BUTTON_SIZE_MAP } from '@/constants/button';
import type { ButtonVariant, ButtonSize } from '@/constants/button';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

const Button = memo(
  ({
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    children,
    className,
    type = 'button',
    ...rest
  }: ButtonProps) => (
    <button
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center p-2 font-medium transition-all duration-150',
        'disabled:pointer-events-none disabled:opacity-40',
        BUTTON_VARIANT_MAP[variant],
        size && BUTTON_SIZE_MAP[size],
        className
      )}
      {...rest}
    >
      {leftIcon && (
        <span className="flex flex-shrink-0 items-center" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span className="flex flex-shrink-0 items-center" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  )
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
