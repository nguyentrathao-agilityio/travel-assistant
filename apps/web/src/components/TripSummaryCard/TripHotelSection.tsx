import { Building2, CheckCircle } from 'lucide-react';

// Utils
import { cn } from '@/utils';

// Components
import { Typography, HotelOptionItem } from '@/components';

// Types
import type { HotelAvailability as SuggestedHotel } from '@repo/schemas';
import type { Hotel, HotelAvailability } from '@repo/types';

interface TripHotelSectionProps {
  /** Hotel from tool result (suggested) */
  suggested?: SuggestedHotel | null;
  /** Hotel already booked in local state */
  booked?: Hotel | null;
  nights: number;
  className?: string;
}

const TripHotelSection = ({ suggested, booked, nights, className }: TripHotelSectionProps) => {
  const isBooked = !!booked;

  if (!booked && !suggested) return null;

  const hotel: HotelAvailability | null = booked
    ? {
        ...booked,
        available: true,
        availableRooms: 0,
        maxOccupancyPerRoom: 0,
        nights,
        totalPrice: booked.pricePerNight * nights,
      }
    : (suggested as HotelAvailability);

  if (!hotel) return null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Section label */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Building2 size={13} className="text-icon-transport shrink-0" aria-hidden="true" />
          <Typography
            as="span"
            variant="label"
            weight="medium"
            color="tertiary"
            className="uppercase tracking-widest"
          >
            Hotel
          </Typography>
        </div>
        {isBooked ? (
          <span className="bg-badge-success-bg text-badge-success-text text-badge flex items-center gap-1 rounded-full px-2 py-0.5 font-medium">
            <CheckCircle size={10} aria-hidden="true" />
            booked
          </span>
        ) : (
          <span className="bg-badge-info-bg text-badge-info-text text-badge rounded-full px-2 py-0.5 font-medium">
            suggested
          </span>
        )}
      </div>

      <HotelOptionItem hotel={hotel} isInfo={true} />
    </div>
  );
};

export { TripHotelSection };
