import { useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';

// Components
import { Button } from '@/components';

// Utils
import { cn, todayClientIso } from '@/utils';

// Constants
import { HOTEL_OPTIONAL_FIELDS, HOTEL_REQUIRED_FIELDS } from '@/constants';

// Types
import type { HotelArgs } from '@/types';

type FieldKey =
  | (typeof HOTEL_REQUIRED_FIELDS)[number]['key']
  | (typeof HOTEL_OPTIONAL_FIELDS)[number]['key'];

const INPUT_CLASS = cn(
  'bg-background-primary border-border-secondary rounded-md border px-3 py-2 w-full',
  'text-body font-regular text-text-primary placeholder:text-text-tertiary',
  'outline-none disabled:opacity-40'
);

export interface HotelContextFormProps {
  args: HotelArgs;
  disabled?: boolean;
  initialValues?: Partial<Record<string, string>>;
  onConfirm: (filled: HotelArgs) => void;
  onCancel: () => void;
}

/**
 * Collects missing hotel search parameters before the search tool runs.
 * Designed for an interactive tool renderer and shows loading after submit.
 */
const HotelContextForm = ({
  args,
  onConfirm,
  onCancel,
  disabled = false,
  initialValues,
}: HotelContextFormProps) => {
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>(
    (initialValues ?? {}) as Partial<Record<FieldKey, string>>
  );
  const [submitted, setSubmitted] = useState(false);

  const isDisabled = submitted || disabled;

  const missingRequired = HOTEL_REQUIRED_FIELDS.filter((f) => !args[f.key]);
  const missingOptional = HOTEL_OPTIONAL_FIELDS.filter((f) => !args[f.key]);

  const canSubmit = !isDisabled && missingRequired.every((f) => values[f.key]?.trim());

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const key = e.currentTarget.dataset.key as FieldKey | undefined;

    if (!key) return;
    const val = e.currentTarget.value;

    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    const allMissing = [
      ...HOTEL_REQUIRED_FIELDS.filter((f) => !args[f.key]),
      ...HOTEL_OPTIONAL_FIELDS.filter((f) => !args[f.key]),
    ];
    const filled: HotelArgs = { ...args };

    allMissing.forEach(({ key }) => {
      const val = values[key];

      if (val?.trim()) filled[key] = val;
    });
    onConfirm(filled);
  }, [submitted, args, values, onConfirm]);

  return (
    <div className="card-typography border-border-secondary bg-background-primary flex w-full max-w-sm flex-col gap-3 rounded-lg border shadow">
      <div className="border-border-tertiary border-b px-5 py-4">
        <p className="text-card-title text-text-primary font-medium">Search hotels</p>
        <p className="text-meta font-regular text-text-secondary">
          {args.city ?? '?'} · {args.check_in ?? '?'} → {args.check_out ?? '?'}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        {missingRequired.map(({ key, label, placeholder, type }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-label text-text-tertiary font-medium uppercase tracking-widest">
              {label} <span className="text-red-500">*</span>
            </label>
            <input
              data-key={key}
              type={type}
              placeholder={placeholder}
              value={values[key] ?? ''}
              onChange={handleChange}
              disabled={isDisabled}
              className={INPUT_CLASS}
              {...(type === 'date' && { min: todayClientIso() })}
            />
          </div>
        ))}

        {missingOptional.length > 0 &&
          missingOptional.map(({ key, label, placeholder, type }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-label text-text-tertiary font-medium uppercase tracking-widest">
                {label}
              </label>
              <input
                data-key={key}
                type={type}
                placeholder={placeholder}
                value={values[key] ?? ''}
                onChange={handleChange}
                disabled={isDisabled}
                className={INPUT_CLASS}
              />
            </div>
          ))}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isDisabled}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!canSubmit}>
            Search hotels
          </Button>
        </div>
      </div>
    </div>
  );
};

export { HotelContextForm };
