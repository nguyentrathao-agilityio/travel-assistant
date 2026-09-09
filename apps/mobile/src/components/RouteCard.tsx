import { StyleSheet, View } from 'react-native';

// Types
import type { LandmarkTourRoute } from '@repo/types';

// Utils
import { shellSpacing } from '../theme';
import { formatDuration, toTravelLeg } from '@repo/utils';

// Components
import { Card, Typography } from './common';
import { StopCard } from './StopCard';

interface RouteCardProps {
  data: LandmarkTourRoute;
}

export const RouteCard = ({ data }: RouteCardProps) => (
  <Card style={styles.card}>
    <View style={styles.headerRow}>
      <Typography style={styles.title} variant="title" weight="medium">
        📍 {data.city} landmark route
      </Typography>
      <Typography color="muted" variant="meta">
        ⏱ {formatDuration(data.totalDurationMin)}
      </Typography>
    </View>
    {data.stops.length > 0 && (
      <Typography color="muted" variant="meta">
        {data.stops.length} stop{data.stops.length !== 1 ? 's' : ''}
      </Typography>
    )}

    {data.stops.length > 0 && (
      <View style={styles.stops}>
        {data.stops.map((stop, index) => (
          <StopCard
            index={index + 1}
            key={stop.name}
            nextLeg={index < data.legs.length ? toTravelLeg(data.legs[index]) : undefined}
            stop={stop}
          />
        ))}
      </View>
    )}
  </Card>
);

const styles = StyleSheet.create({
  card: {
    gap: shellSpacing.sm,
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
  stops: {
    gap: shellSpacing.sm,
  },
});
