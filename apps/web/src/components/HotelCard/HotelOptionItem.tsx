// Utils
import { cn, formatPrice, getAmenityIcon, getAmenityColor, getRatingColor } from '@/utils';

// Components
import { Badge, Button, StarRating, Typography } from '@/components';
import type { BadgeVariant } from '@/components';

// Constants
import { HOTEL_AMENITIES_MAX_DISPLAY } from '@/constants';

// Types
import type { HotelAvailability } from '@repo/types';

interface HotelOptionItemProps {
  hotel: HotelAvailability;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  badge?: string;
  badgeVariant?: BadgeVariant;
  isConfirmed?: boolean;
  isInfo?: boolean;
}

const HotelOptionItem = ({
  hotel,
  isSelected = false,
  onSelect,
  badge,
  badgeVariant = 'success',
  isConfirmed = false,
  isInfo = false,
}: HotelOptionItemProps) => {
  const handleSelect = () => onSelect && onSelect(hotel.id);
  const ratingColor = getRatingColor(hotel.rating);

  return (
    <div
      className={cn(
        'flex overflow-hidden rounded-md border transition-colors',
        isSelected || isInfo ? 'bg-background-info' : 'hover:bg-background-secondary'
      )}
    >
      {/* Thumbnail */}
      {hotel.imageUrl && (
        <div className="w-28 shrink-0 self-stretch">
          <img src={hotel.imageUrl} alt={hotel.name} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        {/* Name + stars + badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Typography variant="option-title" weight="medium">
                {hotel.name}
              </Typography>
              <StarRating count={hotel.starRating} />
            </div>
            <div
              className={cn(
                'bg-border-secondary/50 rounded-pill text-badge inline-flex w-fit px-2 py-0.5 font-medium',
                ratingColor.textClass
              )}
            >
              ★ {hotel.rating.toFixed(1)}/5
            </div>
          </div>
          {badge && <Badge variant={badgeVariant} label={badge} showIcon={false} />}
        </div>

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hotel.amenities.slice(0, HOTEL_AMENITIES_MAX_DISPLAY).map((amenity, idx) => {
              const Icon = getAmenityIcon(amenity);
              const colorClass = getAmenityColor(amenity, idx);
              return (
                <div
                  key={amenity}
                  className={cn(
                    'rounded-pill text-badge inline-flex items-center gap-1 px-2 py-0.5 font-medium',
                    colorClass
                  )}
                >
                  {Icon && <Icon size={12} />}
                  <span>{amenity}</span>
                </div>
              );
            })}
            {hotel.amenities.length > HOTEL_AMENITIES_MAX_DISPLAY && (
              <Typography variant="meta" color="tertiary">
                +{hotel.amenities.length - HOTEL_AMENITIES_MAX_DISPLAY} more
              </Typography>
            )}
          </div>
        )}

        {/* Price + button */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div>
            <Typography variant="option-title" weight="medium" color="primary">
              {formatPrice(hotel.pricePerNight, hotel.currency)}/night
            </Typography>
            <Typography variant="meta" color="tertiary">
              {formatPrice(hotel.totalPrice, hotel.currency)} total
              {hotel.nights ? ` · ${hotel.nights} night${hotel.nights !== 1 ? 's' : ''}` : ''}
            </Typography>
          </div>
          {onSelect &&
            !isConfirmed &&
            (isSelected ? (
              <Typography variant="meta" weight="medium" color="tertiary">
                Selected
              </Typography>
            ) : (
              <Button size="sm" variant="primary" onClick={handleSelect}>
                Select
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
};

export { HotelOptionItem };
