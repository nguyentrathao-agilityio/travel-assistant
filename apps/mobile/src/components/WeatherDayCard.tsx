import { StyleSheet, View, type ViewStyle } from 'react-native';

// Types
import type { DailyForecast } from '@repo/types';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';
import { formatDayDate, toFahrenheit } from '../utils/weather';

// Components
import { Typography } from './common';

interface WeatherDayCardProps {
  day: DailyForecast;
  dayNumber: number;
  isBest?: boolean;
  isSingle?: boolean;
  showNumber?: boolean;
  style?: ViewStyle;
}

const WEATHER_ICON_THRESHOLDS: [number, string][] = [
  [0, '☀️'],
  [3, '⛅'],
  [48, '☁️'],
  [67, '🌧️'],
  [77, '❄️'],
  [82, '🌧️'],
  [86, '❄️'],
];

const getWeatherIcon = (code?: number): string => {
  if (code === undefined) return '⛈️';

  return WEATHER_ICON_THRESHOLDS.find(([threshold]) => code <= threshold)?.[1] ?? '⛈️';
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: shellColors.surface,
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.button,
    borderWidth: 1,
    gap: shellSpacing.xs,
    padding: shellSpacing.sm,
  },
  cardHighlighted: {
    borderColor: shellColors.accentGradientStart,
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
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.pill,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  bestBadge: {
    backgroundColor: shellColors.accentGradientStart,
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
