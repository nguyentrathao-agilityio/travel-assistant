import { useCoAgent } from '@copilotkit/react-core';
import { useEffect, useCallback, useMemo, useRef } from 'react';

// Constants
import { AGENT_NAME } from '@/constants';

// Stores
import { useThreadStore, useTripStateStore } from '@/stores';

// Types
import type { Flight, HotelAvailability, SelectedFlight, TripState } from '@repo/types';
import { useShallow } from 'zustand/shallow';

// Utils
import { todayClientIso, clientTimezone as getClientTimezone } from '@/utils';

const EMPTY_TRIP_STATE: TripState = {};

export const useTripState = () => {
  const sessionId = useThreadStore((s) => s.activeThreadId);
  const { savedState, setTripState, clearTripState } = useTripStateStore(
    useShallow((state) => ({
      savedState: state.tripStates[sessionId] ?? EMPTY_TRIP_STATE,
      setTripState: state.setTripState,
      clearTripState: state.clearTripState,
    }))
  );

  const { state, setState } = useCoAgent<TripState>({
    name: AGENT_NAME,
    initialState: (): TripState => ({
      ...(useTripStateStore.getState().tripStates[sessionId] ?? {}),
      clientDate: todayClientIso(),
      clientTimezone: getClientTimezone(),
    }),
  });

  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    const saved = useTripStateStore.getState().tripStates[sessionId];
    const clientDate = { clientDate: todayClientIso(), clientTimezone: getClientTimezone() };
    setState(() =>
      saved && Object.keys(saved).length > 0 ? { ...saved, ...clientDate } : clientDate
    );
  }, []);

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    if (!state || Object.keys(state).length === 0) return;

    // A new backend snapshot may omit UI-owned booking selections. Merge
    // defined remote fields into the per-thread cache instead of replacing
    // the confirmed hotel/flight with undefined.
    const definedState = Object.fromEntries(
      Object.entries(state).filter(([, value]) => value !== undefined)
    ) as TripState;
    const nextState = { ...savedState, ...definedState };

    if (JSON.stringify(nextState) !== JSON.stringify(savedState)) {
      setTripState(sessionId, nextState);
    }
  }, [state, savedState, sessionId, setTripState]);

  const effectiveState = useMemo<TripState>(
    () => ({
      ...savedState,
      ...(state ?? {}),
      flights: state?.flights ?? savedState.flights,
      flightSelectionStatus: state?.flightSelectionStatus ?? savedState.flightSelectionStatus,
      hotel: state?.hotel ?? savedState.hotel,
      hotelSelectionStatus: state?.hotelSelectionStatus ?? savedState.hotelSelectionStatus,
    }),
    [state, savedState]
  );

  const selectFlight = useCallback(
    (flight: Flight, type: keyof SelectedFlight) => {
      const current = useTripStateStore.getState().tripStates[sessionId] ?? {};
      setTripState(sessionId, {
        ...current,
        flights: { ...(current.flights ?? {}), [type]: flight },
        flightSelectionStatus: 'confirmed',
      });
      setState((prev) => ({
        ...(prev ?? {}),
        flights: { ...(prev?.flights ?? {}), [type]: flight },
        flightSelectionStatus: 'confirmed',
      }));
    },
    [sessionId, setState, setTripState]
  );

  const selectHotel = useCallback(
    (hotel: HotelAvailability) => {
      const current = useTripStateStore.getState().tripStates[sessionId] ?? {};
      setTripState(sessionId, {
        ...current,
        hotel,
        hotelSelectionStatus: 'confirmed',
      });
      setState((prev) => ({
        ...(prev ?? {}),
        hotel,
        hotelSelectionStatus: 'confirmed',
      }));
    },
    [sessionId, setState, setTripState]
  );

  const clearTrip = useCallback(() => {
    hasRestoredRef.current = false;
    setState(() => ({}));
    clearTripState(sessionId);
  }, [setState, sessionId, clearTripState]);

  return { state: effectiveState, selectFlight, selectHotel, clearTrip };
};
