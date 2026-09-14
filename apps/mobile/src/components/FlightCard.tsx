import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// Types
import type { Flight, FlightSearchResult } from '@repo/types';

// Constants
import { FLIGHT_TAB, type FlightTab } from '@repo/constants';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { computeBadges } from '../utils/flight';
import { formatDateFull, formatPrice, formatTime } from '@repo/utils';

// Components
import { Card, ConfirmBanner, Typography } from './common';
import { FlightOptionItem } from './FlightOptionItem';

import type { ShellColors } from '../theme';

interface FlightCardProps {
  data: FlightSearchResult;
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  onSelect?: (flight: Flight, type: FlightTab) => void;
  onContinueBooking?: (departure: Flight, returnFlight?: Flight) => void;
  isConfirmed?: boolean;
  isBookingLocked?: boolean;
  initialDeparture?: Flight | null;
  initialReturn?: Flight | null;
}

export const FlightCard = ({
  data,
  origin,
  destination,
  departureDate,
  returnDate,
  adults = 1,
  onSelect,
  onContinueBooking,
  isConfirmed = false,
  isBookingLocked = false,
  initialDeparture = null,
  initialReturn = null,
}: FlightCardProps) => {
  const [selectedDeparture, setSelectedDeparture] = useState<Flight | null>(initialDeparture);
  const [selectedReturn, setSelectedReturn] = useState<Flight | null>(initialReturn);
  const [activeTab, setActiveTab] = useState<FlightTab>(FLIGHT_TAB.DEPARTURE);
  const [confirmed, setConfirmed] = useState(isConfirmed);
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const hasReturn = Boolean(data.returnResults?.length);

  const handleSelectDeparture = useCallback(
    (id: string) => {
      if (isBookingLocked) return;

      const flight = data.results.find((f) => f.id === id) ?? null;

      setSelectedDeparture(flight);
      setConfirmed(false);
      if (!selectedReturn && data.returnResults?.length) setActiveTab(FLIGHT_TAB.RETURN);
    },
    [data.results, data.returnResults?.length, isBookingLocked, selectedReturn]
  );

  const handleSelectReturn = useCallback(
    (id: string) => {
      if (isBookingLocked) return;

      const flight = data.returnResults?.find((f) => f.id === id) ?? null;

      setSelectedReturn(flight);
      setConfirmed(false);
      if (!selectedDeparture && data.results.length) setActiveTab(FLIGHT_TAB.DEPARTURE);
    },
    [data.returnResults, data.results.length, isBookingLocked, selectedDeparture]
  );

  const handleChange = useCallback(() => {
    setSelectedDeparture(null);
    setSelectedReturn(null);
    setConfirmed(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedDeparture || isBookingLocked) return;
    onSelect?.(selectedDeparture, FLIGHT_TAB.DEPARTURE);
    if (selectedReturn) onSelect?.(selectedReturn, FLIGHT_TAB.RETURN);
    onContinueBooking?.(selectedDeparture, selectedReturn ?? undefined);
    setConfirmed(true);
  }, [selectedDeparture, selectedReturn, isBookingLocked, onSelect, onContinueBooking]);

  const outboundBadges = useMemo(() => computeBadges(data.results), [data.results]);
  const returnBadges = useMemo(() => computeBadges(data.returnResults ?? []), [data.returnResults]);

  const activeFlights = activeTab === FLIGHT_TAB.DEPARTURE ? data.results : data.returnResults;
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

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          {origin && destination && (
            <Typography style={styles.title} variant="title" weight="medium">
              ✈️ {origin} → {destination}
            </Typography>
          )}
          <Typography color="muted" variant="meta">
            {formatDateFull(activeTab === FLIGHT_TAB.DEPARTURE ? departureDate : returnDate)}
          </Typography>
        </View>
        <Typography color="muted" variant="meta">
          {data.count} flight{data.count !== 1 ? 's' : ''} found
        </Typography>

        {hasReturn && (
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setActiveTab(FLIGHT_TAB.DEPARTURE)}
              style={[styles.tab, activeTab === FLIGHT_TAB.DEPARTURE && styles.tabActive]}
            >
              <Typography variant="meta" weight="medium">
                Departure ({data.results.length})
              </Typography>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab(FLIGHT_TAB.RETURN)}
              style={[styles.tab, activeTab === FLIGHT_TAB.RETURN && styles.tabActive]}
            >
              <Typography variant="meta" weight="medium">
                Return ({data.returnResults?.length ?? 0})
              </Typography>
            </Pressable>
          </View>
        )}

        {activeFlights?.length ? (
          activeFlights.map((flight) => (
            <FlightOptionItem
              badge={activeBadges.get(flight.id)}
              flight={flight}
              isBookingLocked={isBookingLocked}
              isSelected={activeSelectedId === flight.id}
              key={flight.id}
              onSelect={onSelect ? activeOnSelect : undefined}
            />
          ))
        ) : (
          <Typography color="muted" style={styles.emptyText} variant="meta">
            No flights found for this route.
          </Typography>
        )}
      </Card>

      {showBanner && (
        <ConfirmBanner
          confirmDisabled={isBookingLocked}
          description={bannerDescription}
          onChangeClick={handleChange}
          onConfirmClick={handleConfirm}
          price={formatPrice(totalPrice, currency)}
          title={bannerTitle}
        />
      )}
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      gap: shellSpacing.sm,
    },
    card: {
      gap: shellSpacing.xs,
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
    tabRow: {
      flexDirection: 'row',
      gap: shellSpacing.xs,
      marginTop: shellSpacing.xs,
    },
    tab: {
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.sm,
      paddingVertical: shellSpacing.xs,
    },
    tabActive: {
      backgroundColor: colors.accentGradientStart,
    },
    emptyText: {
      paddingVertical: shellSpacing.md,
      textAlign: 'center',
    },
  });
