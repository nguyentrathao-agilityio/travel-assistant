import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { TRIP_STATES_STORAGE_KEY } from '@/constants';

import type { TripState } from '@repo/types';

type TripStateStore = {
  tripStates: Record<string, TripState>;
  setTripState: (threadId: string, state: TripState) => void;
  clearTripState: (threadId: string) => void;
};

export const useTripStateStore = create<TripStateStore>()(
  persist(
    (set) => ({
      tripStates: {},
      setTripState: (threadId, state) =>
        set((prev) => ({ tripStates: { ...prev.tripStates, [threadId]: state } })),
      clearTripState: (threadId) =>
        set((prev) => {
          const { [threadId]: _, ...rest } = prev.tripStates;
          return { tripStates: rest };
        }),
    }),
    {
      name: TRIP_STATES_STORAGE_KEY,
      partialize: (state) => ({ tripStates: state.tripStates }),
    }
  )
);
