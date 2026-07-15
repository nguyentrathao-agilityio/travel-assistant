// Utils
import { cn } from '@/utils';

// Components
import { Typography, PlaceItem } from '@/components';

// Types
import type { PlacesSearchResult } from '@repo/schemas';

interface TripPlacesSectionProps {
  places?: PlacesSearchResult | null;
  className?: string;
}

const TripPlacesSection = ({ places, className }: TripPlacesSectionProps) => {
  if (!places?.results?.length) return null;

  const topPlaces = places.results.slice(0, 6);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Typography
          as="span"
          variant="label"
          weight="medium"
          color="tertiary"
          className="uppercase tracking-widest"
        >
          Top places
        </Typography>
        <Typography as="span" variant="meta" color="tertiary">
          {topPlaces.length} total
        </Typography>
      </div>

      <div className="border-border-secondary divide-border-tertiary divide-y overflow-hidden rounded-lg border">
        {topPlaces.map((place) => (
          <PlaceItem key={place.id} place={place} />
        ))}
      </div>
    </div>
  );
};

export { TripPlacesSection };
