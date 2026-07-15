import { useState } from 'react';
import { Navigation } from 'lucide-react';

// Components
import { Button, FilterChip, Input } from '@/components';

// Constants
import { ROUTE_MAX_STOPS_OPTIONS, ROUTE_DEFAULT_MAX_STOPS } from '@/constants';

export interface RouteConfirmArgs {
  city: string;
  maxStops: number;
}

interface RouteConfirmCardProps extends RouteConfirmArgs {
  onConfirm?: (args: RouteConfirmArgs) => void;
  onCancel?: () => void;
}

const RouteConfirmCard = ({
  city: initialCity = '',
  maxStops: initialMaxStops,
  onConfirm,
  onCancel,
}: RouteConfirmCardProps) => {
  const [city, setCity] = useState(initialCity);
  const [maxStops, setMaxStops] = useState(String(initialMaxStops ?? ROUTE_DEFAULT_MAX_STOPS));

  const handleConfirm = () => {
    onConfirm?.({ city: city.trim(), maxStops: Number(maxStops) });
  };

  return (
    <div className="border-border-secondary bg-background-primary flex w-full max-w-sm flex-col gap-3 rounded-lg border">
      {/* Header */}
      <div className="border-border-tertiary border-b px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Navigation size={14} className="text-text-secondary" aria-hidden="true" />
          <p className="text-card-title text-text-primary font-medium">Plan route</p>
        </div>
        <p className="text-meta font-regular text-text-secondary mt-0.5">
          {city ? `${city} landmark tour` : 'Review and adjust before confirming'}
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

        {/* Number of stops */}
        <div className="flex flex-col gap-1.5">
          <label className="text-label text-text-tertiary font-medium uppercase tracking-widest">
            Number of stops
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ROUTE_MAX_STOPS_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                option={opt}
                isActive={maxStops === opt.value}
                onSelect={setMaxStops}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Plan route ↗
          </Button>
        </div>
      </div>
    </div>
  );
};

export { RouteConfirmCard };
