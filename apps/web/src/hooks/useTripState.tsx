import { useAgent } from '@copilotkit/react-core/v2';
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

  const { agent } = useAgent({ agentId: AGENT_NAME });
  const state = agent.state as TripState;

  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    const saved = useTripStateStore.getState().tripStates[sessionId];
    const clientDate = { clientDate: todayClientIso(), clientTimezone: getClientTimezone() };

    agent.setState(
      saved && Object.keys(saved).length > 0 ? { ...saved, ...clientDate } : clientDate
    );
  }, [agent, sessionId]);

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    if (!state || Object.keys(state).length === 0) return;

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
      flightBooking: state?.flightBooking ?? savedState.flightBooking,
      hotel: state?.hotel ?? savedState.hotel,
      hotelSelectionStatus: state?.hotelSelectionStatus ?? savedState.hotelSelectionStatus,
      hotelBooking: state?.hotelBooking ?? savedState.hotelBooking,
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
      const currentAgentState = (agent.state as TripState) ?? {};
      agent.setState({
        ...currentAgentState,
        flights: { ...(currentAgentState.flights ?? {}), [type]: flight },
        flightSelectionStatus: 'confirmed',
      });
    },
    [agent, sessionId, setTripState]
  );

  const selectHotel = useCallback(
    (hotel: HotelAvailability) => {
      const current = useTripStateStore.getState().tripStates[sessionId] ?? {};

      setTripState(sessionId, {
        ...current,
        hotel,
        hotelSelectionStatus: 'confirmed',
      });
      agent.setState({
        ...((agent.state as TripState) ?? {}),
        hotel,
        hotelSelectionStatus: 'confirmed',
      });
    },
    [agent, sessionId, setTripState]
  );

  const clearTrip = useCallback(() => {
    hasRestoredRef.current = false;
    agent.setState({});
    clearTripState(sessionId);
  }, [agent, sessionId, clearTripState]);

  return { state: effectiveState, selectFlight, selectHotel, clearTrip };
};
