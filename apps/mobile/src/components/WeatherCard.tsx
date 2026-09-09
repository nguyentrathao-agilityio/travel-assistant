import { ScrollView, StyleSheet, View } from 'react-native';

// Types
import type { WeatherResult } from '@repo/types';

// Constants
import { WEATHER_FORECAST_MAX_DAYS } from '@repo/constants';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../theme';
import { formatDayDate, getBestDayIndex } from '@repo/utils';

// Components
import { Card, Typography } from './common';
import { WeatherDayCard } from './WeatherDayCard';

interface WeatherCardProps {
  data: WeatherResult;
}

export const WeatherCard = ({ data }: WeatherCardProps) => {
  const visibleDays = (data.daily ?? []).slice(0, WEATHER_FORECAST_MAX_DAYS);
  const bestIdx = getBestDayIndex(visibleDays);

  return (
    <Card style={styles.card}>
      <Typography color="primary" variant="title" weight="medium">
        ☀️ {data.location.name} Weather
      </Typography>
      <Typography color="muted" variant="meta">
        {visibleDays.length}-day{visibleDays.length !== 1 ? 's' : ''} forecast
      </Typography>

      {visibleDays.length === 1 ? (
        <WeatherDayCard day={visibleDays[0]} dayNumber={1} isSingle showNumber={false} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.grid}>
            {visibleDays.map((day, idx) => (
              <WeatherDayCard
                day={day}
                dayNumber={idx + 1}
                isBest={idx === bestIdx}
                key={day.date}
                style={styles.dayCard}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {visibleDays.length > 1 && (
        <View style={styles.banner}>
          <Typography color="muted" variant="meta">
            🔆 Best day for outdoor activities: {formatDayDate(visibleDays[bestIdx].date)}
          </Typography>
        </View>
      )}

      {data.travelTip && (
        <View style={styles.banner}>
          <Typography color="faint" variant="meta">
            Tip: {data.travelTip}
          </Typography>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: shellSpacing.sm,
  },
  grid: {
    flexDirection: 'row',
    gap: shellSpacing.sm,
  },
  dayCard: {
    width: 120,
  },
  banner: {
    backgroundColor: shellColors.pillBackground,
    borderRadius: shellRadii.button,
    padding: shellSpacing.sm,
  },
});
