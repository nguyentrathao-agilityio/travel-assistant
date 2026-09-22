import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

// Components
import { Card, Typography } from './common';
import { TripPlacesSection } from './TripPlacesSection';
import { TripTipsSection } from './TripTipsSection';

// Utils
import { shellSpacing, useShellTheme } from '../theme';

// Types
import type { ShellColors } from '../theme';
import type { DestinationExplorerResult } from '@repo/schemas';

interface DestinationExplorerCardProps {
  data: DestinationExplorerResult;
}

const Divider = () => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={styles.divider} />;
};

export const DestinationExplorerCard = ({ data }: DestinationExplorerCardProps) => {
  const { city, places, tips, weather } = data;
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const hasPlaces = !!places && places.results.length > 0;
  const hasTips = !!tips && tips.count > 0;
  const hasWeather = !!weather;

  return (
    <Card style={styles.card}>
      <Typography variant="title" weight="medium">
        📍 {city}
      </Typography>

      {hasWeather && (
        <View style={styles.section}>
          <Typography color="faint" variant="label" weight="semibold">
            WEATHER NOW
          </Typography>
          <View style={styles.weatherRow}>
            <Typography variant="body" weight="medium">
              {weather.current.temperatureC}°C
            </Typography>
            <Typography color="muted" variant="body">
              · {weather.current.description}
            </Typography>
          </View>
          {weather.travelTip && (
            <Typography color="muted" variant="meta">
              {weather.travelTip}
            </Typography>
          )}
        </View>
      )}

      {hasTips && (
        <>
          {hasWeather && <Divider />}
          <TripTipsSection tips={tips} />
        </>
      )}

      {hasPlaces && (
        <>
          {(hasWeather || hasTips) && <Divider />}
          <TripPlacesSection places={places} />
        </>
      )}
    </Card>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    card: {
      gap: shellSpacing.sm,
    },
    section: {
      gap: shellSpacing.xs,
    },
    weatherRow: {
      alignItems: 'baseline',
      flexDirection: 'row',
      gap: shellSpacing.xs,
    },
    divider: {
      backgroundColor: colors.surfaceBorder,
      height: 1,
    },
  });
