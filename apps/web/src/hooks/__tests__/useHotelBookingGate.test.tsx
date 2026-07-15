import { renderHook } from '@testing-library/react';
import { useHotelBookingGate } from '@/hooks/useHotelBookingGate';

const mockUseHumanInTheLoop = jest.fn();

jest.mock('@copilotkit/react-core', () => ({
  useHumanInTheLoop: (...args: unknown[]) => mockUseHumanInTheLoop(...args),
}));

jest.mock('@/hooks/useTripState', () => ({
  useTripState: () => ({ state: {} }),
}));

jest.mock('@/constants', () => ({
  ACTIONS: { WAIT_FOR_HOTEL_BOOKING: 'waitForHotelBooking' },
}));

jest.mock('@/components', () => ({ Button: () => null, Typography: () => null }));
jest.mock('@/utils', () => ({ cn: (...args: string[]) => args.join(' ') }));

describe('useHotelBookingGate', () => {
  it('registers with waitForHotelBooking action name', () => {
    renderHook(() => useHotelBookingGate());
    expect(mockUseHumanInTheLoop).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'waitForHotelBooking' })
    );
  });
});
