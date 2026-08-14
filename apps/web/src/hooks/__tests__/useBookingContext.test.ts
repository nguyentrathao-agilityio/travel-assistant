import { renderHook } from '@testing-library/react';
import { useBookingContext } from '@/hooks/useBookingContext';

const mockUseCopilotAction = jest.fn();
const mockUseCopilotReadable = jest.fn();

jest.mock('@copilotkit/react-core', () => ({
  useCopilotAction: (...args: unknown[]) => mockUseCopilotAction(...args),
  useCopilotReadable: (...args: unknown[]) => mockUseCopilotReadable(...args),
}));

jest.mock('@/hooks/useTripState', () => ({
  useTripState: () => ({ state: {} }),
}));

beforeEach(() => {
  mockUseCopilotAction.mockClear();
  mockUseCopilotReadable.mockClear();
});

describe('useBookingContext', () => {
  it('exposes booking state as context without registering internal tools', () => {
    renderHook(() => useBookingContext());
    expect(mockUseCopilotAction).not.toHaveBeenCalled();
    expect(mockUseCopilotReadable).toHaveBeenCalledTimes(1);
    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: expect.stringContaining('Current booking state'),
      value: { flights: null, hotel: null },
    });
  });
});
