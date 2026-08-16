import { MapPin, Thermometer } from 'lucide-react';

// Types
import type { DestinationExplorerResult } from '@repo/schemas';

// Utils
import { cn } from '@/utils';

// Components
import { Typography } from '@/components';
import { TripPlacesSection } from '../TripSummaryCard/TripPlacesSection';
import { TripTipsSection } from '../TripSummaryCard/TripTipsSection';

interface DestinationExplorerCardProps {
  data: DestinationExplorerResult;
  className?: string;
}

/**
 * Unified destination overview card — weather, local tips, and top places in one view.
 * Rendered by useDestinationExplorerAction after the destination-explorer-workflow completes.
 */
const DestinationExplorerCard = ({ data, className }: DestinationExplorerCardProps) => {
  const { city, places, tips, weather } = data;

  const hasPlaces = places && places.results.length > 0;
  const hasTips = tips && tips.count > 0;
  const hasWeather = !!weather;

  return (
    <div
      className={cn(
        'card-typography border-border-tertiary w-full max-w-2xl overflow-hidden rounded-lg shadow',
        className
      )}
    >
      {/* Header */}
      <div className="bg-user-gradient px-5 py-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="shrink-0 text-white/70" aria-hidden="true" />
          <Typography as="h2" variant="card-title" weight="medium" className="text-white">
            {city}
          </Typography>
        </div>
      </div>

      {/* Body */}
      <div className="bg-background-primary flex flex-col gap-3 px-5 py-4">
        {/* Weather section */}
        {hasWeather && (
          <div className="flex flex-col gap-2">
            <Typography
              as="span"
              variant="label"
              weight="medium"
              color="tertiary"
              className="uppercase tracking-widest"
            >
              Weather now
            </Typography>

            <div className="flex items-center gap-2">
              <Thermometer size={14} className="text-text-secondary shrink-0" aria-hidden="true" />
              <Typography as="span" variant="body" weight="medium">
                {weather.current.temperatureC}°C
              </Typography>
              <Typography as="span" variant="body" color="secondary">
                · {weather.current.description}
              </Typography>
            </div>

            {weather.travelTip && (
              <Typography as="p" variant="meta" color="secondary" className="italic">
                {weather.travelTip}
              </Typography>
            )}
          </div>
        )}

        {/* Tips section */}
        {hasTips && (
          <>
            {hasWeather && <div className="bg-border-tertiary h-px" />}
            <TripTipsSection tips={tips} />
          </>
        )}

        {/* Places section */}
        {hasPlaces && (
          <>
            {(hasWeather || hasTips) && <div className="bg-border-tertiary h-px" />}
            <TripPlacesSection places={places} />
          </>
        )}
      </div>
    </div>
  );
};

export { DestinationExplorerCard };
