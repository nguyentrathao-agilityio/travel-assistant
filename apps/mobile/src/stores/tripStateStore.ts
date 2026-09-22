import { create } from 'zustand';

import type { TripState } from '@repo/types';

type TripStateStore = {
  tripStates: Record<string, TripState>;
  setTripState: (threadId: string, state: TripState) => void;
  clearTripState: (threadId: string) => void;
};

export const useTripStateStore = create<TripStateStore>()((set) => ({
  tripStates: {},
  setTripState: (threadId, state) =>
    set((previousState) => ({
      tripStates: { ...previousState.tripStates, [threadId]: state },
    })),
  clearTripState: (threadId) =>
    set((previousState) => {
      const remainingTripStates = { ...previousState.tripStates };

      delete remainingTripStates[threadId];

      return { tripStates: remainingTripStates };
    }),
}));
