import { useCoAgent } from '@copilotkit/react-core';
import { useEffect, useCallback, useRef } from 'react';

// Constants
import { AGENT_NAME } from '@/constants';

// Stores
import { useThreadStore, useTripStateStore } from '@/stores';

// Types
import type { Flight, HotelAvailability, SelectedFlight, TripState } from '@repo/types';
import { useShallow } from 'zustand/shallow';

export const useTripState = () => {
  const sessionId = useThreadStore((s) => s.activeThreadId);
  const { setTripState, clearTripState } = useTripStateStore(
    useShallow((state) => ({
      setTripState: state.setTripState,
      clearTripState: state.clearTripState,
    }))
  );

  const { state, setState } = useCoAgent<TripState>({
    name: AGENT_NAME,
    initialState: (): TripState => useTripStateStore.getState().tripStates[sessionId] ?? {},
  });

  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    const saved = useTripStateStore.getState().tripStates[sessionId];
    setState(() => (saved && Object.keys(saved).length > 0 ? saved : {}));
  }, []);

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    if (!state || Object.keys(state).length === 0) return;

    setTripState(sessionId, state);
  }, [state, sessionId, setTripState]);

  const selectFlight = useCallback(
    (flight: Flight, type: keyof SelectedFlight) => {
      setState((prev) => ({
        ...(prev ?? {}),
        flights: { ...(prev?.flights ?? {}), [type]: flight },
      }));
    },
    [setState]
  );

  const selectHotel = useCallback(
    (hotel: HotelAvailability) => {
      setState((prev) => ({ ...(prev ?? {}), hotel }));
    },
    [setState]
  );

  const clearTrip = useCallback(() => {
    hasRestoredRef.current = false;
    setState(() => ({}));
    clearTripState(sessionId);
  }, [setState, sessionId, clearTripState]);

  return { state, selectFlight, selectHotel, clearTrip };
};
