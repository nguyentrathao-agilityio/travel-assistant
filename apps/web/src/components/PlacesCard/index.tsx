import { MapPin } from 'lucide-react';

// Utils
import { cn } from '@/utils';

// Components
import { Typography } from '@/components';
import { PlaceItem } from './PlaceItem';

// Types
import type { PlaceSearchResult } from '@repo/types';

interface PlacesCardProps {
  data: PlaceSearchResult;
  className?: string;
}

/**
 * Generative UI card — places discovery with category filter.
 */
const PlacesCard = ({ data, className }: PlacesCardProps) => {
  const total = data.results.length ?? 0;

  return (
    <div className={cn('card-typography flex w-full max-w-2xl flex-col gap-3', className)}>
      <div className="border-border-tertiary overflow-hidden rounded-lg shadow">
        {/* Header */}
        <div className="bg-user-gradient px-5 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-white/70" aria-hidden="true" />
              <Typography variant="card-title" weight="medium" className="text-white">
                Places{data?.city ? ` in ${data.city}` : ''}
              </Typography>
            </div>
            <Typography as="span" variant="meta" className="text-white/70">
              {total} place{total !== 1 ? 's' : ''}
            </Typography>
          </div>
        </div>

        {/* Place list */}
        {data?.results?.length ? (
          <div className="bg-background-primary divide-border-tertiary flex flex-col divide-y">
            {data.results.map((place) => (
              <PlaceItem key={place.id} place={place} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-4">
            <Typography variant="meta" color="tertiary" className="text-center">
              No places in this category
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
};

export { PlacesCard };
export { PlaceItem } from './PlaceItem';
export { PlacesConfirmCard } from './PlacesConfirmCard';
