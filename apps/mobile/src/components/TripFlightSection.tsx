import { StyleSheet, View } from 'react-native';

// Types
import type { Flight } from '@repo/types';
import type { SuggestedFlight } from '@repo/schemas';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';

// Components
import { FlightOptionItem } from './FlightOptionItem';
import { Typography } from './common';

interface TripFlightSectionProps {
  suggested?: SuggestedFlight | null;
  booked?: Flight | null;
  bookedReturn?: Flight | null;
}

export const TripFlightSection = ({ suggested, booked, bookedReturn }: TripFlightSectionProps) => {
  const departureFlight = booked ?? suggested;
  const isBooked = !!booked;
  const hasReturn = !!bookedReturn;

  if (!departureFlight) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Typography color="faint" variant="label" weight="semibold">
          ✈️ FLIGHT
        </Typography>
        <View style={[styles.badge, isBooked && styles.badgeBooked]}>
          <Typography variant="label">{isBooked ? '✓ booked' : 'suggested'}</Typography>
        </View>
      </View>

      {hasReturn && (
        <Typography color="muted" variant="label" weight="semibold">
          DEPARTURE
        </Typography>
      )}
      <View style={styles.itemWrapper}>
        <FlightOptionItem flight={departureFlight as Flight} />
      </View>

      {bookedReturn && (
        <>
          <Typography color="muted" variant="label" weight="semibold">
            RETURN
          </Typography>
          <View style={styles.itemWrapper}>
            <FlightOptionItem flight={bookedReturn} />
          </View>
        </>
      )}
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
    paddingHorizontal: shellSpacing.sm,
  },
});
