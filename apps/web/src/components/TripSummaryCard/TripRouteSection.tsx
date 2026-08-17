import { useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';

// Utils
import { cn, formatDuration, offsetDate, chunk, getSlot } from '@/utils';

// Constants
import { ROUTE_TIME_SLOTS } from '@/constants';
import type { RouteTimeSlot } from '@/constants';

const SLOT_ICON_COLOR: Record<RouteTimeSlot, string> = {
  morning: 'text-icon-morning',
  afternoon: 'text-icon-afternoon',
  evening: 'text-icon-evening',
};

// Components
import { Typography, FilterChip } from '@/components';
import type { FilterOption } from '@/components';

// Types
import type { LandmarkStop, RouteResult } from '@repo/schemas';

interface TripRouteSectionProps {
  route?: RouteResult | null;
  days: number;
  startDate?: string;
  className?: string;
}

interface StopItemProps {
  stop: LandmarkStop;
  isLast: boolean;
}

const StopItem = ({ stop, isLast }: StopItemProps) => (
  <div className={cn('flex gap-2.5', isLast && 'items-center')}>
    {/* Timeline column */}
    <div className="flex flex-col items-center">
      <div
        className={cn('bg-text-tertiary h-1.5 w-1.5 shrink-0 rounded-full', !isLast && 'mt-1.5')}
      />
      {!isLast && <div className="bg-border-secondary mt-1 w-px flex-1" />}
    </div>

    <div className={cn('min-w-0 flex-1', !isLast && 'pb-3')}>
      <div className="flex items-baseline gap-2">
        <Typography variant="body" weight="medium" color="primary">
          {stop.name}
        </Typography>
        {stop.visitDurationMin && (
          <Typography as="span" variant="meta" color="tertiary">
            · {formatDuration(stop.visitDurationMin)}
          </Typography>
        )}
      </div>

      {stop.entranceFee !== undefined && stop.entranceFee > 0 && (
        <Typography variant="meta" color="tertiary">
          Entrance: ${stop.entranceFee}
        </Typography>
      )}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Day-by-day route plan with FilterChip day tabs.
 * Stops are distributed evenly across days and then grouped into
 * morning / afternoon / evening slots by proportional index.
 */
const TripRouteSection = ({ route, days, startDate, className }: TripRouteSectionProps) => {
  const [activeDay, setActiveDay] = useState(0);

  if (!route?.stops?.length) return null;

  const effectiveDays = Math.max(1, days);
  const stopsPerDay = Math.ceil(route.stops.length / effectiveDays);
  const dayGroups = chunk(route.stops, stopsPerDay);

  // FilterChip options — one per actual day group
  const dayOptions: FilterOption[] = dayGroups.map((_, i) => ({
    value: String(i),
    label: `Day ${i + 1}`,
  }));

  const currentStops = dayGroups[activeDay] ?? [];
  const dayDate = offsetDate(startDate, activeDay);

  // Group current day's stops into time-of-day slots
  const slotMap = new Map<RouteTimeSlot, { stop: LandmarkStop; globalIdx: number }[]>();

  ROUTE_TIME_SLOTS.forEach(({ key }) => slotMap.set(key, []));
  currentStops.forEach((stop, idx) => {
    const globalIdx = activeDay * stopsPerDay + idx;
    const slot = getSlot(idx, currentStops.length);

    slotMap.get(slot)!.push({ stop, globalIdx });
  });

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-icon-transport shrink-0" aria-hidden="true" />
          <Typography
            as="span"
            variant="label"
            weight="medium"
            color="tertiary"
            className="uppercase tracking-widest"
          >
            Day-by-day plan
          </Typography>
        </div>
        <Typography as="span" variant="meta" color="tertiary">
          {effectiveDays} day{effectiveDays !== 1 ? 's' : ''} ·{' '}
          {formatDuration(route.totalDurationMin)} total
        </Typography>
      </div>

      {/* Day tabs */}
      {dayOptions.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {dayOptions.map((opt) => (
            <FilterChip
              key={opt.value}
              option={opt}
              isActive={opt.value === String(activeDay)}
              onSelect={(v) => setActiveDay(Number(v))}
            />
          ))}
        </div>
      )}

      {/* Day content */}
      <div className="border-border-secondary bg-background-primary flex flex-col gap-4 rounded-lg border px-4 py-3">
        {/* Day header */}
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-icon-link shrink-0" aria-hidden="true" />
          <Typography variant="body" weight="medium">
            Day {activeDay + 1}
            {dayDate && (
              <Typography as="span" variant="body" color="tertiary">
                {' '}
                — {dayDate}
              </Typography>
            )}
          </Typography>
        </div>

        {/* Time slots */}
        {(() => {
          const nonEmptySlots = ROUTE_TIME_SLOTS.map(({ key, label, Icon }) => ({
            key,
            label,
            Icon,
            stops: slotMap.get(key) ?? [],
          })).filter((s) => s.stops.length > 0);

          return nonEmptySlots.map((slot, slotIdx) => {
            const isLastSlot = slotIdx === nonEmptySlots.length - 1;

            return (
              <div key={slot.key} className="flex flex-col gap-2">
                {/* Slot label */}
                <div className="flex items-center gap-1.5">
                  <slot.Icon
                    size={13}
                    className={cn(SLOT_ICON_COLOR[slot.key], 'shrink-0')}
                    aria-hidden="true"
                  />
                  <Typography
                    as="span"
                    variant="label"
                    weight="medium"
                    color="secondary"
                    className="uppercase tracking-wide"
                  >
                    {slot.label}
                  </Typography>
                </div>

                {/* Stops list */}
                <div className="flex flex-col pl-1">
                  {slot.stops.map(({ stop }, stopIdx) => (
                    <StopItem
                      key={stop.name}
                      stop={stop}
                      isLast={isLastSlot && stopIdx === slot.stops.length - 1}
                    />
                  ))}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Travel tip */}
      {route.travelTip && (
        <Typography as="p" variant="meta" color="secondary" className="italic">
          💡 {route.travelTip}
        </Typography>
      )}
    </div>
  );
};

export { TripRouteSection };
