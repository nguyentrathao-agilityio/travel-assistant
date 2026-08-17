import { useTripStateStore } from '@/stores/tripStateStore';
import type { TripState } from '@repo/types';

const makeState = (destination = 'Da Nang'): TripState => ({
  destination,
  startDate: '2026-07-01',
  endDate: '2026-07-05',
  travelers: 2,
});

beforeEach(() => {
  useTripStateStore.setState({ tripStates: {} });
  localStorage.clear();
});

describe('useTripStateStore', () => {
  it('has empty tripStates as initial state', () => {
    expect(useTripStateStore.getState().tripStates).toEqual({});
  });

  it('setTripState stores state for a thread', () => {
    const state = makeState();

    useTripStateStore.getState().setTripState('thread-1', state);
    expect(useTripStateStore.getState().tripStates['thread-1']).toEqual(state);
  });

  it('keeps trip state in memory without writing it to browser storage', () => {
    useTripStateStore.getState().setTripState('thread-1', makeState());

    expect(localStorage).toHaveLength(0);
  });

  it('setTripState updates existing state for a thread', () => {
    useTripStateStore.getState().setTripState('thread-1', makeState('Da Nang'));
    useTripStateStore.getState().setTripState('thread-1', makeState('Hanoi'));
    expect(useTripStateStore.getState().tripStates['thread-1']?.destination).toBe('Hanoi');
  });

  it('setTripState does not affect other threads', () => {
    useTripStateStore.getState().setTripState('thread-1', makeState('Da Nang'));
    useTripStateStore.getState().setTripState('thread-2', makeState('Hanoi'));
    expect(useTripStateStore.getState().tripStates['thread-1']?.destination).toBe('Da Nang');
    expect(useTripStateStore.getState().tripStates['thread-2']?.destination).toBe('Hanoi');
  });

  it('clearTripState removes state for a specific thread', () => {
    useTripStateStore.getState().setTripState('thread-1', makeState());
    useTripStateStore.getState().clearTripState('thread-1');
    expect(useTripStateStore.getState().tripStates['thread-1']).toBeUndefined();
  });

  it('clearTripState does not affect other threads', () => {
    useTripStateStore.getState().setTripState('thread-1', makeState('Da Nang'));
    useTripStateStore.getState().setTripState('thread-2', makeState('Hanoi'));
    useTripStateStore.getState().clearTripState('thread-1');
    expect(useTripStateStore.getState().tripStates['thread-2']?.destination).toBe('Hanoi');
    expect(Object.keys(useTripStateStore.getState().tripStates)).toHaveLength(1);
  });

  it('clearTripState is a no-op for a non-existent thread', () => {
    useTripStateStore.getState().clearTripState('non-existent');
    expect(useTripStateStore.getState().tripStates).toEqual({});
  });
});
