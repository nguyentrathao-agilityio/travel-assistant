import { useMemo, useState, useCallback } from 'react';
import { Building2 } from 'lucide-react';

// Utils
import { cn, computeHotelBadges, formatDateRange, formatPrice } from '@/utils';

// Components
import { LoadingCard, Typography, ConfirmBanner } from '@/components';
import { HotelOptionItem } from './HotelOptionItem';

// Types
import type { HotelSearchResult, HotelAvailability } from '@repo/types';

interface HotelCardProps {
  data: HotelSearchResult;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  className?: string;
  onSelect?: (hotel: HotelAvailability) => void;
  isConfirmed?: boolean;
  initialHotel?: HotelAvailability | null;
}

const HotelCard = ({
  data,
  city,
  checkIn,
  checkOut,
  className,
  onSelect,
  isConfirmed = false,
  initialHotel = null,
}: HotelCardProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialHotel?.id ?? null);
  const [confirmed, setConfirmed] = useState(isConfirmed);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setConfirmed(false);
  }, []);

  const handleChange = useCallback(() => {
    setSelectedId(null);
    setConfirmed(false);
  }, []);

  const handleConfirm = useCallback(() => {
    const selectedHotel = data?.results.find((h) => h.id === selectedId);
    if (selectedHotel) {
      onSelect?.(selectedHotel);
      setConfirmed(true);
    }
  }, [selectedId, data?.results, onSelect]);

  const badges = useMemo(() => computeHotelBadges(data?.results ?? []), [data?.results]);
  const selectedHotel = data?.results.find((h) => h.id === selectedId);
  const showBanner = !confirmed && selectedHotel;
  const total = data?.results.length ?? 0;

  return (
    <div
      className={cn(
        'border-border-tertiary flex w-full max-w-2xl flex-col gap-3 overflow-hidden rounded-lg shadow',
        className
      )}
    >
      {/* Header */}
      <div className="bg-user-gradient px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-white/70" aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              <Typography variant="card-title" weight="medium" className="text-white">
                Hotels{city ? ` in ${city}` : ''}
              </Typography>
              <Typography variant="meta" className="text-white/70">
                {total} option{total !== 1 ? 's' : ''} found
              </Typography>
            </div>
          </div>
          {checkIn && checkOut && (
            <Typography as="span" variant="meta" className="text-white/70">
              {formatDateRange(checkIn, checkOut)}
            </Typography>
          )}
        </div>
      </div>

      {/* Hotel list */}
      <div className="bg-background-primary flex flex-col gap-2 p-3">
        {data.results.length === 0 ? (
          <div className="px-2 py-4 text-center">
            <Typography variant="body" color="tertiary">
              No hotels found for these dates.
            </Typography>
          </div>
        ) : (
          data.results.map((hotel) => {
            const badge = badges.get(hotel.id);
            return (
              <HotelOptionItem
                key={hotel.id}
                hotel={hotel}
                isSelected={selectedId === hotel.id}
                onSelect={handleSelect}
                badge={badge?.label}
                badgeVariant={badge?.variant}
                isConfirmed={confirmed}
              />
            );
          })
        )}
      </div>

      {showBanner && selectedHotel && (
        <ConfirmBanner
          title={selectedHotel.name}
          description={`${selectedHotel.city} · ★ ${selectedHotel.rating.toFixed(1)}/5`}
          price={formatPrice(selectedHotel.totalPrice, selectedHotel.currency)}
          onChangeClick={handleChange}
          onConfirmClick={handleConfirm}
        />
      )}
    </div>
  );
};

export { HotelCard };
export { HotelOptionItem } from './HotelOptionItem';
