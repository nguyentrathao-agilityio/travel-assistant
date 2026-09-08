import { Pressable, StyleSheet, View } from 'react-native';

// Types
import type { Flight } from '@repo/types';

// Constants
import { FLIGHT_LOW_SEATS_THRESHOLD } from '../constants';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';
import { formatDuration } from '../utils/route';
import { formatPrice, formatTime } from '../utils/format';
import type { FlightBadge } from '../utils/flight';

// Components
import { Typography } from './common';

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
          {onSelect &&
            (isSelected ? (
              <Typography color="muted" variant="meta" weight="medium">
                Selected
              </Typography>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={isBookingLocked}
                onPress={() => onSelect(flight.id)}
                style={[styles.selectButton, isBookingLocked && styles.selectButtonDisabled]}
              >
                <Typography variant="label" weight="semibold">
                  Select
                </Typography>
              </Pressable>
            ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor: shellColors.surfaceBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: shellSpacing.sm,
    paddingVertical: shellSpacing.sm,
  },
  containerSelected: {
    backgroundColor: shellColors.pillBackground,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: shellColors.accentGradientStart,
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
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.pill,
    paddingHorizontal: shellSpacing.xs,
    paddingVertical: 2,
  },
  price: {
    flex: 1,
  },
  selectButton: {
    backgroundColor: shellColors.accentGradientStart,
    borderRadius: shellRadii.pill,
    paddingHorizontal: shellSpacing.sm,
    paddingVertical: shellSpacing.xs,
  },
  selectButtonDisabled: {
    opacity: 0.4,
  },
});
