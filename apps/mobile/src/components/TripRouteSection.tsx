import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// Components
import { Typography } from './common';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { formatDuration } from '@repo/utils';
import { offsetDate } from '@repo/utils';

// Types
import type { ShellColors } from '../theme';
import type { LandmarkStop, RouteResult } from '@repo/schemas';

interface TripRouteSectionProps {
  route?: RouteResult | null;
  days: number;
  startDate?: string;
}

const chunk = <T,>(items: T[], size: number): T[][] => {
  const result: T[][] = [];

  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));

  return result;
};

const StopRow = ({ stop }: { stop: LandmarkStop }) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.stopRow}>
      <View style={styles.dot} />
      <View style={styles.stopContent}>
        <Typography variant="meta" weight="medium">
          {stop.name}
          {stop.visitDurationMin ? ` · ${formatDuration(stop.visitDurationMin)}` : ''}
        </Typography>
        {!!stop.entranceFee && (
          <Typography color="faint" variant="label">
            Entrance: ${stop.entranceFee}
          </Typography>
        )}
      </View>
    </View>
  );
};

export const TripRouteSection = ({ route, days, startDate }: TripRouteSectionProps) => {
  const [activeDay, setActiveDay] = useState(0);
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!route?.stops?.length) return null;

  const effectiveDays = Math.max(1, days);
  const stopsPerDay = Math.ceil(route.stops.length / effectiveDays);
  const dayGroups = chunk(route.stops, stopsPerDay);
  const currentStops = dayGroups[activeDay] ?? [];
  const dayDate = offsetDate(startDate, activeDay);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Typography color="faint" variant="label" weight="semibold">
          📍 DAY-BY-DAY PLAN
        </Typography>
        <Typography color="faint" variant="label">
          {effectiveDays} day{effectiveDays !== 1 ? 's' : ''} ·{' '}
          {formatDuration(route.totalDurationMin)} total
        </Typography>
      </View>

      {dayGroups.length > 1 && (
        <View style={styles.tabRow}>
          {dayGroups.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => setActiveDay(index)}
              style={[styles.tab, activeDay === index && styles.tabActive]}
            >
              <Typography variant="label" weight="medium">
                Day {index + 1}
              </Typography>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.dayCard}>
        <Typography variant="meta" weight="medium">
          🗓️ Day {activeDay + 1}
          {dayDate ? ` — ${dayDate}` : ''}
        </Typography>
        {currentStops.map((stop) => (
          <StopRow key={stop.name} stop={stop} />
        ))}
      </View>

      {route.travelTip && (
        <Typography color="muted" variant="meta">
          💡 {route.travelTip}
        </Typography>
      )}
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      gap: shellSpacing.sm,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    tabRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: shellSpacing.xs,
    },
    tab: {
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.sm,
      paddingVertical: shellSpacing.xs,
    },
    tabActive: {
      backgroundColor: colors.accentGradientStart,
    },
    dayCard: {
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.button,
      gap: shellSpacing.sm,
      padding: shellSpacing.sm,
    },
    stopRow: {
      flexDirection: 'row',
      gap: shellSpacing.xs,
      paddingLeft: shellSpacing.xs,
    },
    dot: {
      backgroundColor: colors.textOnDarkFaint,
      borderRadius: 3,
      height: 6,
      marginTop: 6,
      width: 6,
    },
    stopContent: {
      flex: 1,
      gap: 1,
    },
  });
