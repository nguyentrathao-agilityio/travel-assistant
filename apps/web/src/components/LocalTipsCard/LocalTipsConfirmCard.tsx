import { useState } from 'react';
import { Lightbulb } from 'lucide-react';

// Components
import { Button, FilterChip, Input } from '@/components';

// Constants
import { TIP_CATEGORIES, TIP_CATEGORY_OPTIONS } from '@/constants';

// Utils
import { cn } from '@/utils';

export interface LocalTipsConfirmArgs {
  city: string;
  country: string;
  category: string;
  essentialOnly: boolean;
}

interface LocalTipsConfirmCardProps extends LocalTipsConfirmArgs {
  onConfirm?: (args: LocalTipsConfirmArgs) => void;
  onCancel?: () => void;
}

const LocalTipsConfirmCard = ({
  city: initialCity = '',
  country: initialCountry = '',
  category: initialCategory,
  essentialOnly: initialEssentialOnly = false,
  onConfirm,
  onCancel,
}: LocalTipsConfirmCardProps) => {
  const [city, setCity] = useState(initialCity);
  const [country, setCountry] = useState(initialCountry);
  const [category, setCategory] = useState(initialCategory || TIP_CATEGORIES.FOOD);
  const [essentialOnly, setEssentialOnly] = useState(initialEssentialOnly);

  const handleConfirm = () => {
    onConfirm?.({
      city: city.trim(),
      country: country.trim(),
      category,
      essentialOnly,
    });
  };

  const handleToggle = () => setEssentialOnly((v) => !v);

  return (
    <div className="border-border-secondary bg-background-primary flex w-full max-w-sm flex-col gap-3 rounded-lg border">
      {/* Header */}
      <div className="border-border-tertiary border-b px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Lightbulb size={14} className="text-text-secondary" aria-hidden="true" />
          <p className="text-card-title text-text-primary font-medium">Get local tips</p>
        </div>
        <p className="text-meta font-regular text-text-secondary mt-0.5">
          {city ? `Travel tips for ${city}` : 'Review and adjust before fetching travel advice'}
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 px-5 py-4">
        {/* City */}
        <Input
          label="City"
          value={city}
          onChange={setCity}
          placeholder="e.g. Da Nang"
          showIcon={false}
        />

        {/* Country */}
        <Input
          label="Country"
          value={country}
          onChange={setCountry}
          placeholder="e.g. Vietnam"
          showIcon={false}
        />

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-label text-text-tertiary font-medium uppercase tracking-widest">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TIP_CATEGORY_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                option={{ value: opt.value, label: opt.label }}
                isActive={category === opt.value}
                onSelect={setCategory}
              />
            ))}
          </div>
        </div>

        {/* Essential only */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-meta font-regular text-text-secondary">Essential tips only</p>
          <button
            type="button"
            role="switch"
            aria-checked={essentialOnly}
            onClick={handleToggle}
            className={cn(
              'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
              essentialOnly ? 'bg-text-primary' : 'bg-border-secondary'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                essentialOnly ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} className="rounded px-3 py-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} className="rounded px-3 py-2">
            Get tips ↗
          </Button>
        </div>
      </div>
    </div>
  );
};

export { LocalTipsConfirmCard };
