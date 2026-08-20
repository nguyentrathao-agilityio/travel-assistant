import { renderHook } from '@testing-library/react';

import { useTravelCopilot } from '@/hooks/useTravelCopilot';
import * as hooks from '@/hooks';

jest.mock('@/hooks/useBookedActions', () => ({ useBookedActions: jest.fn() }));
jest.mock('@/hooks/useBookingAction', () => ({ useBookingAction: jest.fn() }));
jest.mock('@/hooks/useBookingContext', () => ({ useBookingContext: jest.fn() }));
jest.mock('@/hooks/useDestinationExplorerAction', () => ({
  useDestinationExplorerAction: jest.fn(),
}));
jest.mock('@/hooks/useDefaultToolRenderer', () => ({ useDefaultToolRenderer: jest.fn() }));
jest.mock('@/hooks/useFlightAction', () => ({ useFlightAction: jest.fn() }));
jest.mock('@/hooks/useHotelAction', () => ({ useHotelAction: jest.fn() }));
jest.mock('@/hooks/useLocalTipsAction', () => ({ useLocalTipsAction: jest.fn() }));
jest.mock('@/hooks/usePlacesAction', () => ({ usePlacesAction: jest.fn() }));
jest.mock('@/hooks/useRouteAction', () => ({ useRouteAction: jest.fn() }));
jest.mock('@/hooks/useThemeAction', () => ({ useThemeAction: jest.fn() }));
jest.mock('@/hooks/useTitleSync', () => ({ useTitleSync: jest.fn() }));
jest.mock('@/hooks/useTripSummaryAction', () => ({ useTripSummaryAction: jest.fn() }));
jest.mock('@/hooks/useWeatherAction', () => ({ useWeatherAction: jest.fn() }));

describe('useTravelCopilot', () => {
  it('registers every travel CopilotKit integration from one hook', () => {
    renderHook(() => useTravelCopilot());

    const registrations = [
      hooks.useBookingContext,
      hooks.useDefaultToolRenderer,
      hooks.useBookingAction,
      hooks.useFlightAction,
      hooks.useHotelAction,
      hooks.useWeatherAction,
      hooks.usePlacesAction,
      hooks.useRouteAction,
      hooks.useLocalTipsAction,
      hooks.useTripSummaryAction,
      hooks.useDestinationExplorerAction,
      hooks.useTitleSync,
      hooks.useBookedActions,
      hooks.useThemeAction,
    ];

    registrations.forEach((registration) => expect(registration).toHaveBeenCalledTimes(1));
  });
});
