import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

// Constants
import { FLIGHT_LOW_SEATS_THRESHOLD } from '@repo/constants';

// Components
import { SelectControl, Typography } from './common';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { formatDuration } from '@repo/utils';
import { formatPrice, formatTime } from '@repo/utils';

// Types
import type { ShellColors } from '../theme';
import type { FlightBadge } from '../utils/flight';
import type { Flight } from '@repo/types';

interface FlightOptionItemProps {
  flight: Flight;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  badge?: FlightBadge;
  isBookingLocked?: boolean;
}

export const FlightOptionItem = ({
  flight,
  isSelected = false,
  onSelect,
  badge,
  isBookingLocked = false,
}: FlightOptionItemProps) => {
  const stopsLabel =
    flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`;
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      <View style={styles.avatar}>
        <Typography variant="label" weight="semibold">
          {flight.airline.code.slice(0, 2).toUpperCase()}
        </Typography>
      </View>

      <View style={styles.content}>
        <Typography weight="medium">
          {flight.airline.name} · {flight.flightNumber}
        </Typography>
        <Typography color="muted" variant="meta">
          🕒 {formatTime(flight.departureTime)} → {formatTime(flight.arrivalTime)}
        </Typography>
        <Typography color="muted" variant="meta">
          ⏳ {formatDuration(flight.durationMinutes)} · 📡 {stopsLabel}
        </Typography>
        {flight.seatsAvailable <= FLIGHT_LOW_SEATS_THRESHOLD && (
          <Typography color="faint" variant="meta">
            ✈️ {flight.seatsAvailable} seats left
          </Typography>
        )}

        <View style={styles.footerRow}>
          {badge && (
            <View style={styles.badge}>
              <Typography variant="label">{badge.label}</Typography>
            </View>
          )}
          <Typography style={styles.price} weight="semibold">
            {formatPrice(flight.price, flight.currency)}
          </Typography>
          {onSelect && (
            <SelectControl
              isBookingLocked={isBookingLocked}
              isSelected={isSelected}
              onSelect={() => onSelect(flight.id)}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      borderColor: colors.surfaceBorder,
      borderTopWidth: 1,
      flexDirection: 'row',
      gap: shellSpacing.sm,
      paddingVertical: shellSpacing.sm,
    },
    containerSelected: {
      backgroundColor: colors.pillBackground,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: colors.accentGradientStart,
      borderRadius: shellRadii.button,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    content: {
      flex: 1,
      gap: 2,
    },
    footerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.sm,
      marginTop: shellSpacing.xs,
    },
    badge: {
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.xs,
      paddingVertical: 2,
    },
    price: {
      flex: 1,
    },
  });
