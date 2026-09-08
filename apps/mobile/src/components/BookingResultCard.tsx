import { StyleSheet, View } from 'react-native';

// Types
import type { Booking } from '@repo/types';

// Constants
import { BOOKING_STATUSES } from '@repo/constants';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';
import { formatPrice } from '../utils/format';

// Components
import { Card, Typography } from './common';

interface BookingResultCardProps {
  booking: Booking;
}

export const BookingResultCard = ({ booking }: BookingResultCardProps) => {
  const isCancelled = booking.status === BOOKING_STATUSES.CANCELLED;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Typography>{isCancelled ? '❌' : '✅'}</Typography>
        <View style={styles.headerText}>
          <Typography variant="title" weight="medium">
            {isCancelled ? 'Booking cancelled' : 'Booking confirmed'}
          </Typography>
          <Typography color="muted" variant="meta">
            {booking.summary}
          </Typography>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailCell}>
          <Typography color="faint" variant="label">
            CONFIRMATION
          </Typography>
          <Typography variant="meta">{booking.confirmationCode}</Typography>
        </View>
        <View style={styles.detailCell}>
          <Typography color="faint" variant="label">
            TOTAL
          </Typography>
          <Typography variant="meta">
            {formatPrice(booking.totalPrice, booking.currency)}
          </Typography>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: shellSpacing.sm,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: shellSpacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  detailsGrid: {
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.button,
    flexDirection: 'row',
    gap: shellSpacing.md,
    padding: shellSpacing.sm,
  },
  detailCell: {
    flex: 1,
    gap: 2,
  },
});
