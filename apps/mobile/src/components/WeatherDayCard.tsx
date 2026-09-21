import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

// Types
import type { DailyForecast } from '@repo/types';

// Constants
import { DEFAULT_WEATHER_ICON, WEATHER_ICON_THRESHOLDS } from '../constants';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { formatDayDate, toFahrenheit } from '@repo/utils';

// Components
import { Typography } from './common';

import type { ShellColors } from '../theme';

interface WeatherDayCardProps {
  day: DailyForecast;
  dayNumber: number;
  isBest?: boolean;
  isSingle?: boolean;
  showNumber?: boolean;
  style?: ViewStyle;
}

const getWeatherIcon = (code?: number): string => {
  if (code === undefined) return DEFAULT_WEATHER_ICON;

  return (
    WEATHER_ICON_THRESHOLDS.find(([threshold]) => code <= threshold)?.[1] ?? DEFAULT_WEATHER_ICON
  );
};

export const WeatherDayCard = ({
  day,
  dayNumber,
  isSingle = false,
  isBest = false,
  showNumber = true,
  style,
}: WeatherDayCardProps) => {
  const highF = toFahrenheit(day.tempMaxC);
  const lowF = toFahrenheit(day.tempMinC);
  const rainPct = day.precipitationProbabilityMax ?? 0;
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, (isBest || isSingle) && styles.cardHighlighted, style]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {showNumber && (
            <View style={styles.stepBadge}>
              <Typography variant="label" weight="semibold">
                {dayNumber}
              </Typography>
            </View>
          )}
          <Typography color="muted" variant="meta">
            {formatDayDate(day.date)}
          </Typography>
        </View>
        {isBest && (
          <View style={styles.bestBadge}>
            <Typography variant="label" weight="semibold">
              Best
            </Typography>
          </View>
        )}
      </View>

      <View style={styles.conditionRow}>
        <Typography>{getWeatherIcon(day.weatherCode)}</Typography>
        <Typography numberOfLines={1} style={styles.conditionText} weight="medium">
          {day.description}
        </Typography>
      </View>

      <View style={styles.tempsRow}>
        <Typography variant="heading" weight="medium">
          {highF}°F
        </Typography>
        <Typography color="faint" variant="body">
          {lowF}°F
        </Typography>
      </View>

      <Typography color="faint" variant="meta">
        💧 {rainPct}%
      </Typography>
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.button,
      borderWidth: 1,
      gap: shellSpacing.xs,
      padding: shellSpacing.sm,
    },
    cardHighlighted: {
      borderColor: colors.accentGradientStart,
      borderWidth: 2,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    headerLeft: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.xs,
    },
    stepBadge: {
      alignItems: 'center',
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.pill,
      height: 20,
      justifyContent: 'center',
      width: 20,
    },
    bestBadge: {
      backgroundColor: colors.accentGradientStart,
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.xs,
      paddingVertical: 2,
    },
    conditionRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: shellSpacing.xs,
    },
    conditionText: {
      flex: 1,
    },
    tempsRow: {
      alignItems: 'baseline',
      flexDirection: 'row',
      gap: shellSpacing.xs,
    },
  });
