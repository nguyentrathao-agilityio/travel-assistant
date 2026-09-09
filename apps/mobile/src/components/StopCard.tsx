import { Linking, Pressable, StyleSheet, View } from 'react-native';

// Types
import type { LandmarkStop, TravelLeg } from '@repo/types';

// Constants
import { TRAVEL_TRANSPORT_LABELS } from '../constants';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';
import { formatDuration } from '@repo/utils';
import { toMapsUrl } from '../utils/route';

// Components
import { Card, Typography } from './common';

interface StopCardProps {
  stop: LandmarkStop;
  index: number;
  nextLeg?: TravelLeg;
}

export const StopCard = ({ stop, index, nextLeg }: StopCardProps) => {
  const { name, description, visitDurationMin, openingHours, entranceFee, lat, lng } = stop;
  const mapsUrl = toMapsUrl(lat, lng);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.stepBadge}>
          <Typography variant="label" weight="semibold">
            {index}
          </Typography>
        </View>

        <Card style={styles.card}>
          <View style={styles.titleRow}>
            <Typography style={styles.title} weight="medium">
              {name}
            </Typography>
            {visitDurationMin && (
              <View style={styles.durationPill}>
                <Typography color="muted" variant="label">
                  ~{formatDuration(visitDurationMin)}
                </Typography>
              </View>
            )}
          </View>

          {description && (
            <Typography color="muted" variant="meta">
              {description}
            </Typography>
          )}

          <View style={styles.metaRow}>
            {openingHours && (
              <Typography color="faint" variant="meta">
                🕒 {openingHours}
              </Typography>
            )}
            {typeof entranceFee === 'number' && (
              <Typography color="faint" variant="meta">
                🎫 {entranceFee === 0 ? 'Free entry' : entranceFee.toLocaleString()}
              </Typography>
            )}
            {mapsUrl && (
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(mapsUrl)}>
                <Typography color="faint" style={styles.mapLink} variant="meta">
                  🔗 Map
                </Typography>
              </Pressable>
            )}
          </View>
        </Card>
      </View>

      {nextLeg && (
        <View style={styles.legRow}>
          <Typography color="muted" variant="meta">
            {TRAVEL_TRANSPORT_LABELS[nextLeg.transport]} · {formatDuration(nextLeg.durationMin)}
            {nextLeg.distanceKm ? ` · ${nextLeg.distanceKm} km` : ''}
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: shellSpacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: shellSpacing.sm,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.pill,
    height: 24,
    justifyContent: 'center',
    marginTop: 2,
    width: 24,
  },
  card: {
    flex: 1,
    gap: shellSpacing.xs,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: shellSpacing.sm,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
  durationPill: {
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.pill,
    paddingHorizontal: shellSpacing.xs,
    paddingVertical: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: shellSpacing.md,
  },
  mapLink: {
    textDecorationLine: 'underline',
  },
  legRow: {
    paddingLeft: shellSpacing.lg + shellSpacing.xs,
  },
});
