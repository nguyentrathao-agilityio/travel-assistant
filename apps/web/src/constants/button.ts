export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const BUTTON_VARIANT_MAP: Record<ButtonVariant, string> = {
  primary: 'bg-text-primary text-background-primary hover:opacity-80 active:scale-[.98]',
  secondary:
    'bg-background-primary text-text-primary border border-border-secondary hover:bg-background-secondary active:scale-[.98]',
  ghost: 'bg-transparent text-text-secondary hover:bg-background-secondary active:scale-[.98]',
  danger:
    'bg-badge-danger-bg/40 text-badge-danger-text hover:bg-badge-danger-bg/60 active:scale-[.98] dark:bg-badge-danger-bg dark:text-badge-danger-text dark:hover:bg-badge-danger-bg/80',
  brand: 'bg-brand-500 text-white hover:bg-brand-600 active:scale-[.98]',
};

export const BUTTON_SIZE_MAP: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 gap-1.5 rounded-md',
  md: 'px-4 py-2   gap-1.5 rounded-md',
  lg: 'px-5 py-2.5 text-option-title gap-2 rounded-md',
};
