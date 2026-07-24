import { useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { Plane } from 'lucide-react';

// Components
import { Button, Card, Divider } from '@/components';

// Utils
import { cn, todayClientIso } from '@/utils';

// Constants
import { FLIGHT_OPTIONAL_FIELDS, FLIGHT_REQUIRED_FIELDS } from '@/constants';

// Types
import type { FlightArgs } from '@/types';

type FieldKey =
  | (typeof FLIGHT_REQUIRED_FIELDS)[number]['key']
  | (typeof FLIGHT_OPTIONAL_FIELDS)[number]['key'];

const ORIGIN_KEY = 'origin' as const;

const INPUT_CLASS = cn(
  'bg-background-primary border-border-secondary rounded-md border px-3 py-2 w-full',
  'text-body font-regular text-text-primary placeholder:text-text-tertiary',
  'outline-none disabled:opacity-40'
);

export interface FlightContextFormProps {
  args: FlightArgs;
  disabled?: boolean;
  initialValues?: Partial<Record<string, string>>;
  onConfirm: (filled: FlightArgs) => void;
  onCancel: () => void;
}

/**
 * Collects missing flight search parameters before the search tool runs.
 * Hides itself after submit or when the parent marks it disabled (new message arrived).
 * Field order: origin (optional) → destination* → departure_date* → other optional
 */
const FlightContextForm = ({
  args,
  onConfirm,
  onCancel,
  disabled = false,
  initialValues,
}: FlightContextFormProps) => {
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>(
    (initialValues ?? {}) as Partial<Record<FieldKey, string>>
  );
  const [submitted, setSubmitted] = useState(false);

  const missingRequired = FLIGHT_REQUIRED_FIELDS.filter((f) => !args[f.key]);
  const missingOptional = FLIGHT_OPTIONAL_FIELDS.filter((f) => !args[f.key as keyof FlightArgs]);

  const canSubmit = !disabled && missingRequired.every((f) => values[f.key]?.trim());

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const key = e.currentTarget.dataset.key as FieldKey | undefined;
    if (!key) return;
    const val = e.currentTarget.value;
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleConfirm = useCallback(() => {
    setSubmitted(true);
    const allMissing = [
      ...FLIGHT_REQUIRED_FIELDS.filter((f) => !args[f.key]),
      ...FLIGHT_OPTIONAL_FIELDS.filter((f) => !args[f.key as keyof FlightArgs]),
    ];
    const filled: FlightArgs = { ...args };
    allMissing.forEach(({ key }) => {
      const val = values[key as FieldKey];
      if (val?.trim()) filled[key as keyof FlightArgs] = val as never;
    });
    onConfirm(filled);
  }, [args, values, onConfirm]);

  // Hide when submitted locally OR when parent disables (e.g. new message arrived)
  if (submitted || disabled) return null;

  // Render order: origin (optional, if missing) → required fields → remaining optional
  const missingOrigin = missingOptional.filter((f) => f.key === ORIGIN_KEY);
  const missingOtherOptional = missingOptional.filter((f) => f.key !== ORIGIN_KEY);
  const formFields = [
    ...missingOrigin.map((f) => ({ ...f, required: false })),
    ...missingRequired.map((f) => ({ ...f, required: true })),
    ...missingOtherOptional.map((f) => ({ ...f, required: false })),
  ];

  return (
    <Card className="border-border-secondary bg-background-primary flex w-full max-w-sm flex-col rounded-lg border shadow">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Plane size={16} className="text-text-secondary" aria-hidden="true" />
        <p className="text-card-title text-text-primary font-medium">Search flights</p>
      </div>
      <p className="text-meta font-regular text-text-secondary mt-0.5">
        {args.destination
          ? `${args.origin ?? '?'} → ${args.destination}${args.departure_date ? ` · ${args.departure_date}` : ''}`
          : 'Fill in your flight details below'}
      </p>

      <Divider className="mt-3" />

      <div className="mt-3 flex flex-col gap-4">
        {formFields.map(({ key, label, placeholder, type, required }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="text-label text-text-tertiary font-medium uppercase tracking-widest">
              {label}
              {required && <span className="text-red-500"> *</span>}
            </label>
            <input
              data-key={key}
              type={type}
              placeholder={placeholder}
              value={values[key as FieldKey] ?? ''}
              onChange={handleChange}
              className={INPUT_CLASS}
              {...(type === 'date' && { min: todayClientIso() })}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleConfirm} disabled={!canSubmit}>
          Search flights
        </Button>
      </div>
    </Card>
  );
};

export { FlightContextForm };
