import { useAgent } from '@copilotkit/react-native/headless';
import { useCallback, useEffect, useMemo, useRef } from 'react';

// Services
import { fetchThreadValues } from '../services/threadHistory';

// Constants
import { AGENT_NAME, SELECTION_STATUSES } from '@repo/constants';

// Stores
import { useTripStateStore } from '../stores/tripStateStore';

// Utils
import { clientTimezone, todayClientIso } from '@repo/utils';
import { extractTripState } from '../utils/tripState';

// Types
import type { Flight, HotelAvailability, SelectedFlight, TripState } from '@repo/types';

const EMPTY_TRIP_STATE: TripState = {};

interface UseTripStateResult {
  state: TripState;
  selectFlight: (flight: Flight, type: keyof SelectedFlight) => void;
  selectHotel: (hotel: HotelAvailability) => void;
  clearTrip: () => void;
}

export const useTripState = (threadId: string): UseTripStateResult => {
  const savedState = useTripStateStore(
    (storeState) => storeState.tripStates[threadId] ?? EMPTY_TRIP_STATE
  );
  const setTripState = useTripStateStore((storeState) => storeState.setTripState);
  const clearTripState = useTripStateStore((storeState) => storeState.clearTripState);

  const { agent } = useAgent({ agentId: AGENT_NAME });
  const state = agent.state as TripState;

  const hasRestoredRef = useRef(false);

  useEffect(() => {
    hasRestoredRef.current = false;
  }, [threadId]);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const saved = useTripStateStore.getState().tripStates[threadId];
      const clientDate = { clientDate: todayClientIso(), clientTimezone: clientTimezone() };

      if (saved && Object.keys(saved).length > 0) {
        agent.setState({ ...saved, ...clientDate });
        hasRestoredRef.current = true;

        return;
      }

      // No local cache (cold start) — fall back to the server's own checkpoint.
      const serverTripState = await fetchThreadValues(threadId)
        .then(extractTripState)
        .catch(() => ({}) as TripState);

      if (cancelled) return;

      agent.setState({ ...serverTripState, ...clientDate });
      hasRestoredRef.current = true;
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, [agent, threadId]);

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    if (!state || Object.keys(state).length === 0) return;

    const definedState = Object.fromEntries(
      Object.entries(state).filter(([, value]) => value !== undefined)
    ) as TripState;
    const nextState = { ...savedState, ...definedState };

    if (JSON.stringify(nextState) !== JSON.stringify(savedState)) {
      setTripState(threadId, nextState);
    }
  }, [state, savedState, threadId, setTripState]);

  const effectiveState = useMemo<TripState>(
    () => ({ ...savedState, ...(state ?? {}) }),
    [state, savedState]
  );

  const selectFlight = useCallback(
    (flight: Flight, type: keyof SelectedFlight) => {
      const current = useTripStateStore.getState().tripStates[threadId] ?? {};
      const nextFlights = { ...(current.flights ?? {}), [type]: flight };

      setTripState(threadId, {
        ...current,
        flights: nextFlights,
        flightSelectionStatus: SELECTION_STATUSES.CONFIRMED,
      });
      agent.setState({
        ...((agent.state as TripState) ?? {}),
        flights: nextFlights,
        flightSelectionStatus: SELECTION_STATUSES.CONFIRMED,
      });
    },
    [agent, threadId, setTripState]
  );

  const selectHotel = useCallback(
    (hotel: HotelAvailability) => {
      const current = useTripStateStore.getState().tripStates[threadId] ?? {};

      setTripState(threadId, {
        ...current,
        hotel,
        hotelSelectionStatus: SELECTION_STATUSES.CONFIRMED,
      });
      agent.setState({
        ...((agent.state as TripState) ?? {}),
        hotel,
        hotelSelectionStatus: SELECTION_STATUSES.CONFIRMED,
      });
    },
    [agent, threadId, setTripState]
  );

  const clearTrip = useCallback(() => {
    hasRestoredRef.current = false;
    agent.setState({});
    clearTripState(threadId);
  }, [agent, threadId, clearTripState]);

  return { state: effectiveState, selectFlight, selectHotel, clearTrip };
};
