import { renderHook } from '@testing-library/react';
import { useFlightSelectionGate } from '@/hooks/useFlightSelectionGate';

const mockUseHumanInTheLoop = jest.fn();

jest.mock('@copilotkit/react-core', () => ({
  useHumanInTheLoop: (...args: unknown[]) => mockUseHumanInTheLoop(...args),
}));

jest.mock('@/hooks/useTripState', () => ({
  useTripState: () => ({ state: {} }),
}));

jest.mock('@/constants', () => ({
  ACTIONS: { WAIT_FOR_FLIGHT_SELECTION: 'waitForFlightSelection' },
}));

jest.mock('@/components', () => ({ Button: () => null, Typography: () => null }));
jest.mock('@/utils', () => ({ cn: (...args: string[]) => args.join(' ') }));

describe('useFlightSelectionGate', () => {
  it('registers with waitForFlightSelection action name', () => {
    renderHook(() => useFlightSelectionGate());
    expect(mockUseHumanInTheLoop).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'waitForFlightSelection' })
    );
  });
});
