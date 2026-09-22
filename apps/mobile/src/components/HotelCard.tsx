import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// Components
import { Card, ConfirmBanner, Typography } from './common';
import { HotelOptionItem } from './HotelOptionItem';

// Utils
import { shellSpacing } from '../theme';
import { computeHotelBadges } from '../utils/hotel';
import { formatDateRange, formatPrice } from '@repo/utils';

// Types
import type { HotelAvailability, HotelSearchResult } from '@repo/types';

interface HotelCardProps {
  data: HotelSearchResult;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  onSelect?: (hotel: HotelAvailability) => void;
  onContinueBooking?: (hotel: HotelAvailability) => void;
  isConfirmed?: boolean;
  isBookingLocked?: boolean;
  initialHotel?: HotelAvailability | null;
}

export const HotelCard = ({
  data,
  city,
  checkIn,
  checkOut,
  onSelect,
  onContinueBooking,
  isConfirmed = false,
  isBookingLocked = false,
  initialHotel = null,
}: HotelCardProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialHotel?.id ?? null);
  const [confirmed, setConfirmed] = useState(isConfirmed);

  const handleSelect = useCallback(
    (id: string) => {
      if (isBookingLocked) return;

      setSelectedId(id);
      setConfirmed(false);
    },
    [isBookingLocked]
  );

  const handleChange = useCallback(() => {
    setSelectedId(null);
    setConfirmed(false);
  }, []);

  const selectedHotel = data.results.find((hotel) => hotel.id === selectedId);

  const handleConfirm = useCallback(() => {
    if (!selectedHotel || isBookingLocked) return;
    onSelect?.(selectedHotel);
    onContinueBooking?.(selectedHotel);
    setConfirmed(true);
  }, [selectedHotel, isBookingLocked, onSelect, onContinueBooking]);

  const badges = useMemo(() => computeHotelBadges(data.results), [data.results]);
  const showBanner = !confirmed && !!selectedHotel;
  const total = data.results.length;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <Typography style={styles.title} variant="title" weight="medium">
            🏨 Hotels{city ? ` in ${city}` : ''}
          </Typography>
          {checkIn && checkOut && (
            <Typography color="muted" variant="meta">
              {formatDateRange(checkIn, checkOut)}
            </Typography>
          )}
        </View>
        <Typography color="muted" variant="meta">
          {total} option{total !== 1 ? 's' : ''} found
        </Typography>

        {data.results.length ? (
          <View style={styles.list}>
            {data.results.map((hotel) => (
              <HotelOptionItem
                badge={badges.get(hotel.id)}
                hotel={hotel}
                isBookingLocked={isBookingLocked}
                isSelected={selectedId === hotel.id}
                key={hotel.id}
                onSelect={handleSelect}
              />
            ))}
          </View>
        ) : (
          <Typography color="muted" style={styles.emptyText} variant="meta">
            No hotels found for these dates.
          </Typography>
        )}
      </Card>

      {showBanner && selectedHotel && (
        <ConfirmBanner
          confirmDisabled={isBookingLocked}
          description={`${selectedHotel.city} · ★ ${selectedHotel.rating.toFixed(1)}/5`}
          onChangeClick={handleChange}
          onConfirmClick={handleConfirm}
          price={formatPrice(selectedHotel.totalPrice, selectedHotel.currency)}
          title={selectedHotel.name}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: shellSpacing.sm,
  },
  card: {
    gap: shellSpacing.xs,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: shellSpacing.sm,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
  list: {
    gap: shellSpacing.sm,
    marginTop: shellSpacing.xs,
  },
  emptyText: {
    paddingVertical: shellSpacing.md,
    textAlign: 'center',
  },
});
