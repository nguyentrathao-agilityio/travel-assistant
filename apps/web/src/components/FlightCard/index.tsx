import { useMemo, useState, useCallback } from 'react';
import { ArrowRight, Plane } from 'lucide-react';

// Utils
import { cn, computeBadges, formatDateFull, formatPrice, formatTime } from '@/utils';

// Components
import { ConfirmBanner, FilterBar, Typography } from '@/components';
import type { FilterOption } from '@/components';
import { FlightOptionItem } from './FlightOptionItem';

// Constants
import { FLIGHT_TAB } from '@/constants';
import type { FlightTab } from '@/constants';

// Types
import type { Flight, FlightSearchResult } from '@repo/types';

interface FlightCardProps {
  data: FlightSearchResult;
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  className?: string;
  onSelect?: (flight: Flight, type: FlightTab) => void;
  onContinueBooking?: (departure: Flight, returnFlight?: Flight) => void;
  isConfirmed?: boolean;
  initialDeparture?: Flight | null;
  initialReturn?: Flight | null;
}

const FlightCard = ({
  data,
  origin,
  destination,
  departureDate,
  returnDate,
  adults = 1,
  className,
  onSelect,
  onContinueBooking,
  isConfirmed = false,
  initialDeparture = null,
  initialReturn = null,
}: FlightCardProps) => {
  const [selectedDeparture, setSelectedDeparture] = useState<Flight | null>(initialDeparture);
  const [selectedReturn, setSelectedReturn] = useState<Flight | null>(initialReturn);
  const [activeTab, setActiveTab] = useState<FlightTab>(FLIGHT_TAB.DEPARTURE);
  const [confirmed, setConfirmed] = useState(isConfirmed);

  const handleSelectDeparture = useCallback(
    (id: string) => {
      const flight = data?.results?.find((f) => f.id === id) ?? null;
      setSelectedDeparture(flight);
      setConfirmed(false);
      if (!selectedReturn && data?.returnResults?.length) {
        setActiveTab(FLIGHT_TAB.RETURN);
      }
    },
    [data?.results, data?.returnResults?.length, selectedReturn]
  );

  const handleSelectReturn = useCallback(
    (id: string) => {
      const flight = data?.returnResults?.find((f) => f.id === id) ?? null;
      setSelectedReturn(flight);
      setConfirmed(false);
      if (!selectedDeparture && data?.results?.length) {
        setActiveTab(FLIGHT_TAB.DEPARTURE);
      }
    },
    [data?.returnResults, data?.results?.length, selectedDeparture]
  );

  const handleTabChange = useCallback((v: string) => setActiveTab(v as FlightTab), []);

  const handleChange = useCallback(() => {
    setSelectedDeparture(null);
    setSelectedReturn(null);
    setConfirmed(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedDeparture) return;
    onSelect?.(selectedDeparture, FLIGHT_TAB.DEPARTURE);
    if (selectedReturn) onSelect?.(selectedReturn, FLIGHT_TAB.RETURN);
    onContinueBooking?.(selectedDeparture, selectedReturn ?? undefined);
    setConfirmed(true);
  }, [selectedDeparture, selectedReturn, onSelect, onContinueBooking]);

  const outboundBadges = useMemo(() => computeBadges(data?.results ?? []), [data?.results]);
  const returnBadges = useMemo(
    () => computeBadges(data?.returnResults ?? []),
    [data?.returnResults]
  );

  const flightTabs = useMemo<ReadonlyArray<FilterOption>>(
    () => [
      { value: FLIGHT_TAB.DEPARTURE, label: 'Departure', count: data?.results?.length },
      { value: FLIGHT_TAB.RETURN, label: 'Return', count: data?.returnResults?.length },
    ],
    [data?.results?.length, data?.returnResults?.length]
  );

  const hasReturn = Boolean(data.returnResults?.length);
  const activeFlights =
    activeTab === FLIGHT_TAB.DEPARTURE ? data.results : (data.returnResults ?? []);
  const activeBadges = activeTab === FLIGHT_TAB.DEPARTURE ? outboundBadges : returnBadges;
  const activeSelectedId =
    activeTab === FLIGHT_TAB.DEPARTURE ? selectedDeparture?.id : selectedReturn?.id;
  const activeOnSelect =
    activeTab === FLIGHT_TAB.DEPARTURE ? handleSelectDeparture : handleSelectReturn;

  const showBanner =
    !confirmed &&
    (hasReturn
      ? selectedDeparture !== null && selectedReturn !== null
      : selectedDeparture !== null);

  const bannerTitle = hasReturn
    ? 'Departure & return selected'
    : `${selectedDeparture?.airline.name ?? ''} · ${selectedDeparture?.flightNumber ?? ''}`;

  const bannerDescription = hasReturn
    ? `${selectedDeparture?.flightNumber} outbound · ${selectedReturn?.flightNumber} return`
    : `${origin ?? '?'} → ${destination ?? '?'} · ${formatTime(selectedDeparture?.departureTime ?? '')}`;

  const currency = selectedDeparture?.currency ?? 'USD';
  const totalPrice = hasReturn
    ? ((selectedDeparture?.price ?? 0) + (selectedReturn?.price ?? 0)) * adults
    : (selectedDeparture?.price ?? 0) * adults;
  const bannerPrice = showBanner ? formatPrice(totalPrice, currency) : undefined;

  return (
    <div className={cn('flex w-full max-w-2xl flex-col gap-3', className)}>
      <div className="border-border-tertiary overflow-hidden rounded-lg shadow">
        {/* Header */}
        <div className="bg-user-gradient px-5 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Plane size={16} className="text-white/70" aria-hidden="true" />
              {origin && destination && (
                <Typography variant="card-title" weight="medium" className="text-white">
                  {origin}
                  <ArrowRight size={14} className="mx-1 inline text-white/70" aria-hidden="true" />
                  {destination}
                </Typography>
              )}
            </div>
            <Typography as="span" variant="meta" className="text-white/70">
              {formatDateFull(activeTab === FLIGHT_TAB.DEPARTURE ? departureDate : returnDate)}
            </Typography>
          </div>
          <Typography variant="meta" className="mt-0.5 text-white/70">
            {data.count} flight{data.count !== 1 ? 's' : ''} found
          </Typography>

          {hasReturn && (
            <FilterBar
              filters={flightTabs}
              activeFilter={activeTab}
              onChange={handleTabChange}
              className="mt-3"
            />
          )}
        </div>

        {/* Flight list */}
        <div className="bg-background-primary divide-border-tertiary flex flex-col divide-y">
          {activeFlights?.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <Typography variant="body" color="tertiary">
                No flights found for this route.
              </Typography>
            </div>
          ) : (
            activeFlights?.map((flight) => {
              const badge = activeBadges.get(flight.id);
              return (
                <FlightOptionItem
                  key={flight.id}
                  flight={flight}
                  isSelected={activeSelectedId === flight.id}
                  onSelect={onSelect ? activeOnSelect : undefined}
                  badge={badge?.label}
                  badgeVariant={badge?.variant}
                />
              );
            })
          )}
        </div>
      </div>

      {showBanner && (
        <ConfirmBanner
          title={bannerTitle}
          description={bannerDescription}
          price={bannerPrice}
          onChangeClick={handleChange}
          onConfirmClick={handleConfirm}
        />
      )}
    </div>
  );
};

export { FlightCard };
export { FlightOptionItem } from './FlightOptionItem';
