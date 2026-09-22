import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

// Components
import { FlightOptionItem } from './FlightOptionItem';
import { Typography } from './common';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';

// Types
import type { ShellColors } from '../theme';
import type { Flight } from '@repo/types';
import type { SuggestedFlight } from '@repo/schemas';

interface TripFlightSectionProps {
  suggested?: SuggestedFlight | null;
  booked?: Flight | null;
  bookedReturn?: Flight | null;
}

export const TripFlightSection = ({ suggested, booked, bookedReturn }: TripFlightSectionProps) => {
  const departureFlight = booked ?? suggested;
  const isBooked = !!booked;
  const hasReturn = !!bookedReturn;
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      gap: shellSpacing.xs,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    badge: {
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.xs,
      paddingVertical: 2,
    },
    badgeBooked: {
      backgroundColor: colors.accentGradientStart,
    },
    itemWrapper: {
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.button,
      paddingHorizontal: shellSpacing.sm,
    },
  });
