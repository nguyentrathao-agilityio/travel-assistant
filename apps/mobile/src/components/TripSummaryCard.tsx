import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

// Types
import type { Hotel, SelectedFlight } from '@repo/types';
import type { TripSummaryResult } from '@repo/schemas';

// Utils
import { shellColors, shellSpacing } from '../theme';
import { replaceCostEstimateWithBookings } from '../utils/summary';
import { formatDisplayDate } from '../utils/format';

// Components
import { Card, Typography } from './common';
import { TripCostBreakdown } from './TripCostBreakdown';
import { TripFlightSection } from './TripFlightSection';
import { TripHotelSection } from './TripHotelSection';
import { TripRouteSection } from './TripRouteSection';

interface TripSummaryCardProps {
  data: TripSummaryResult;
  bookedFlight?: SelectedFlight;
  bookedHotel?: Hotel;
}

const Divider = () => <View style={styles.divider} />;

export const TripSummaryCard = ({ data, bookedFlight, bookedHotel }: TripSummaryCardProps) => {
  const hasFlight = !!(bookedFlight?.departure ?? data.suggestedFlight);
  const hasHotel = !!(bookedHotel ?? data.suggestedHotel);
  const hasRoute = !!data.route?.stops?.length;

  const finalCostEstimate = useMemo(
    () =>
      replaceCostEstimateWithBookings({
        costEstimate: data.costEstimate,
        days: data.days,
        travelers: data.travelers,
        bookedFlight,
        bookedHotel,
      }),
    [data.costEstimate, data.days, data.travelers, bookedFlight, bookedHotel]
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Typography style={styles.destination} variant="title" weight="medium">
            📍 {data.destination}
          </Typography>
          <View style={styles.summaryBadge}>
            <Typography variant="label">trip summary</Typography>
          </View>
        </View>
        {data.startDate && data.endDate && (
          <Typography color="muted" variant="meta">
            🗓️ {formatDisplayDate(data.startDate)} – {formatDisplayDate(data.endDate)}
          </Typography>
        )}
        <View style={styles.metaRow}>
          <Typography color="muted" variant="meta">
            👤 {data.travelers} traveler{data.travelers !== 1 ? 's' : ''}
          </Typography>
          <Typography color="muted" variant="meta">
            {data.days} night{data.days !== 1 ? 's' : ''}
          </Typography>
        </View>
      </View>

      {hasFlight && (
        <TripFlightSection
          booked={bookedFlight?.departure ?? null}
          bookedReturn={bookedFlight?.return ?? null}
          suggested={data.suggestedFlight}
        />
      )}

      {hasHotel && (
        <>
          {hasFlight && <Divider />}
          <TripHotelSection
            booked={bookedHotel ?? null}
            nights={data.days}
            suggested={data.suggestedHotel}
          />
        </>
      )}

      {hasRoute && (
        <>
          {(hasFlight || hasHotel) && <Divider />}
          <TripRouteSection days={data.days} route={data.route} startDate={data.startDate} />
        </>
      )}

      {(hasFlight || hasHotel || hasRoute) && <Divider />}
      <TripCostBreakdown estimate={finalCostEstimate} />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: shellSpacing.sm,
  },
  header: {
    gap: shellSpacing.xs,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: shellSpacing.sm,
  },
  destination: {
    flex: 1,
  },
  summaryBadge: {
    backgroundColor: shellColors.pillBackground,
    borderRadius: 999,
    paddingHorizontal: shellSpacing.xs,
    paddingVertical: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: shellSpacing.md,
  },
  divider: {
    backgroundColor: shellColors.surfaceBorder,
    height: 1,
  },
});
