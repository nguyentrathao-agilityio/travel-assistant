import { Droplets } from 'lucide-react';

// Utils
import { cn, formatDayDate, getWeatherIcon, toFahrenheit } from '@/utils';

// Components
import { Badge, StepBadge, Typography } from '@/components';

// Types
import type { DailyForecast } from '@repo/types';

interface WeatherDayCardProps {
  day: DailyForecast;
  dayNumber: number;
  isBest?: boolean;
  isSingle?: boolean;
  showNumber?: boolean;
  className?: string;
}

const WeatherDayCard = ({
  day,
  dayNumber,
  isSingle = false,
  isBest = false,
  showNumber = true,
  className,
}: WeatherDayCardProps) => {
  const { icon: WeatherIcon, color: weatherIconColor } = getWeatherIcon(day.weatherCode);
  const highF = toFahrenheit(day.tempMaxC);
  const lowF = toFahrenheit(day.tempMinC);
  const rainPct = day.precipitationProbabilityMax ?? 0;

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-2 rounded-lg border p-3',
        isBest || isSingle
          ? 'border-border-info bg-background-info border-2'
          : 'border-border-tertiary bg-background-primary',
        className
      )}
    >
      {/* Header: day number + date + best badge */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          {showNumber && (
            <StepBadge
              index={dayNumber}
              className="bg-background-info text-text-tertiary border-border-info h-6 w-6 border"
            />
          )}
          <Typography variant="meta" color="secondary">
            {formatDayDate(day.date)}
          </Typography>
        </div>
        {isBest && <Badge variant="success" label="Best" showIcon={false} />}
      </div>

      {/* Condition icon + label */}
      <div className="flex items-start gap-1.5">
        <WeatherIcon
          size={16}
          className={cn('mt-0.5 shrink-0', weatherIconColor)}
          aria-hidden="true"
        />
        <Typography variant="meta" weight="medium" color="primary">
          {day.description}
        </Typography>
      </div>

      {/* High / Low temps — numeric exception allows text-heading (18 px) */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-heading text-text-primary font-medium">{highF}°F</span>
        <span className="text-body font-regular text-text-tertiary">{lowF}°F</span>
      </div>

      {/* Precipitation probability */}
      <div className="flex items-center gap-1">
        <Droplets size={12} className="text-cyan-500" aria-hidden="true" />
        <Typography variant="meta" color="tertiary">
          {rainPct}%
        </Typography>
      </div>
    </div>
  );
};

export { WeatherDayCard };
