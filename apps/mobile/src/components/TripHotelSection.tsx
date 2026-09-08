import { StyleSheet, View } from 'react-native';

// Types
import type { Hotel, HotelAvailability } from '@repo/types';
import type { HotelAvailability as SuggestedHotel } from '@repo/schemas';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';

// Components
import { HotelOptionItem } from './HotelOptionItem';
import { Typography } from './common';

interface TripHotelSectionProps {
  suggested?: SuggestedHotel | null;
  booked?: Hotel | null;
  nights: number;
}

export const TripHotelSection = ({ suggested, booked, nights }: TripHotelSectionProps) => {
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
    : ((suggested as HotelAvailability) ?? null);

  if (!hotel) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Typography color="faint" variant="label" weight="semibold">
          🏨 HOTEL
        </Typography>
        <View style={[styles.badge, isBooked && styles.badgeBooked]}>
          <Typography variant="label">{isBooked ? '✓ booked' : 'suggested'}</Typography>
        </View>
      </View>

      <View style={styles.itemWrapper}>
        <HotelOptionItem hotel={hotel} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: shellSpacing.xs,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.pill,
    paddingHorizontal: shellSpacing.xs,
    paddingVertical: 2,
  },
  badgeBooked: {
    backgroundColor: shellColors.accentGradientStart,
  },
  itemWrapper: {
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.button,
  },
});
