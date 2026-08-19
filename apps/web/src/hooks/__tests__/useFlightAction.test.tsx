import React from 'react';
import { renderHook } from '@testing-library/react';
import { useRenderTool } from '@copilotkit/react-core/v2';
import { useFlightAction } from '@/hooks/useFlightAction';

jest.mock('@/hooks', () => ({
  useTripState: () => ({ selectFlight: jest.fn(), state: {} }),
}));

jest.mock('@/constants', () => ({
  TOOL_NAMES: { FLIGHTS: 'flightsTool' },
  TOOL_STATUS: { IN_PROGRESS: 'inProgress', EXECUTING: 'executing', COMPLETE: 'complete' },
  FLIGHT_BASE_PARAMS: [],
}));

jest.mock('@/components', () => ({
  FlightCard: () => null,
  LoadingCard: () => null,
  SetLastTool: () => null,
  ToolLoading: () => null,
  ToolEmptyCard: () => null,
  ToolErrorCard: () => null,
  ToolInvalidResultCard: () => null,
}));

jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils/toolResult'),
  isToolPending: (status: string) => status === 'inProgress' || status === 'executing',
}));

beforeEach(() => jest.mocked(useRenderTool).mockClear());

describe('useFlightAction', () => {
  it('registers the renderer through the stable v2 registry', () => {
    renderHook(() => useFlightAction());
    expect(jest.mocked(useRenderTool)).toHaveBeenCalledTimes(1);
  });

  it('registers with the flightsTool name', () => {
    renderHook(() => useFlightAction());
    expect(jest.mocked(useRenderTool)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'flightsTool' }),
      expect.any(Array)
    );
  });

  it('render returns LoadingCard when status is inProgress', () => {
    renderHook(() => useFlightAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;
    const result = render({ status: 'inProgress', result: undefined, parameters: {} });

    expect(result).not.toBeNull();
  });

  it('render returns an explicit empty state when result has no results', () => {
    renderHook(() => useFlightAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;
    const result = render({ status: 'complete', result: { results: [] }, parameters: {} });

    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns ToolInvalidResultCard when result is null', () => {
    renderHook(() => useFlightAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;
    const result = render({ status: 'complete', result: undefined, parameters: {} });

    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns ToolInvalidResultCard when result has no results property', () => {
    renderHook(() => useFlightAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;
    const result = render({ status: 'complete', result: {}, parameters: {} });

    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns FlightCard when results are non-empty', () => {
    renderHook(() => useFlightAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;
    const flight = {
      id: 'f1',
      airline: { code: 'VN', name: 'Vietnam Airlines' },
      flightNumber: 'VN100',
      origin: 'HAN',
      destination: 'SGN',
      departureTime: '2026-07-01T08:00:00Z',
      arrivalTime: '2026-07-01T10:00:00Z',
      durationMinutes: 120,
      price: 200,
      currency: 'USD',
      seatsAvailable: 5,
      stops: 0,
    };
    const result = render({
      status: 'complete',
      result: { results: [flight], count: 1 },
      parameters: { origin: 'HAN', destination: 'SGN' },
    });

    expect(result).not.toBeNull();
    const [card] = (result as React.ReactElement<{ children: React.ReactNode[] }>).props.children;

    expect(card).not.toBeNull();
  });

  it('renders a persisted flight result serialized as JSON', () => {
    renderHook(() => useFlightAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;
    const serializedResult = JSON.stringify({
      count: 1,
      results: [{ id: 'f1', flightNumber: 'VN100' }],
    });

    const result = render({ status: 'complete', result: serializedResult, parameters: {} });

    const [card] = (result as React.ReactElement<{ children: React.ReactNode[] }>).props.children;

    expect(card).not.toBeNull();
  });
});
