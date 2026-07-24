import { memo, useCallback, useId } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';

import { cn } from '@/utils';
import { Search } from 'lucide-react';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Helper or error text shown below the input. */
  hint?: string;
  isError?: boolean;
  disabled?: boolean;
  /** Icon rendered on the left inside the input. Defaults to a Search icon when showIcon is true. */
  leftIcon?: ReactNode;
  /** Set to false to hide the left icon entirely (e.g. for form fields). Defaults to true. */
  showIcon?: boolean;
  /** Arbitrary node rendered on the right (e.g. a clear button). */
  rightSlot?: ReactNode;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  className?: string;
  inputClassName?: string;
}

/**
 * Controlled text input with optional label, icons, and hint text.
 * @example
 * <Input value={q} onChange={setQ} placeholder="Search destinations…" leftIcon="ti-search" />
 */
const Input = memo(
  ({
    value,
    onChange,
    placeholder = '',
    label,
    hint,
    isError = false,
    disabled = false,
    leftIcon,
    showIcon = true,
    rightSlot,
    onKeyDown,
    type = 'text',
    className,
    inputClassName,
  }: InputProps) => {
    const id = useId();

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <label
            htmlFor={id}
            className="text-label text-text-tertiary font-medium uppercase tracking-widest"
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            'bg-background-primary flex items-center gap-2 rounded-md border px-3 py-2 transition-colors',
            'focus-within:border-border-info focus-within:ring-border-info focus-within:ring-1',
            isError
              ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-400'
              : 'border-border-secondary hover:border-border-secondary',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          {showIcon !== false && (leftIcon ?? <Search className="opacity-50" />)}
          <input
            id={id}
            type={type}
            value={value}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'text-body font-regular text-text-primary min-w-0 flex-1 bg-transparent',
              'placeholder:text-text-tertiary outline-none',
              inputClassName
            )}
          />

          {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
        </div>

        {hint && (
          <p
            className={cn(
              'text-meta font-regular',
              isError ? 'text-red-500' : 'text-text-tertiary'
            )}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
