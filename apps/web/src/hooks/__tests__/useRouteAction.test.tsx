import React from 'react';
import { renderHook } from '@testing-library/react';
import { useRenderToolCall } from '@copilotkit/react-core';
import { useRouteAction } from '@/hooks/useRouteAction';

jest.mock('@/constants', () => ({
  TOOL_NAMES: { ROUTE: 'routeTool' },
  ROUTE_LOADING_SKELETON_COUNT: 3,
}));
jest.mock('@/components', () => ({
  RouteCard: () => null,
  LoadingCard: () => null,
  SetLastTool: () => null,
  ToolLoading: () => null,
  ToolEmptyCard: () => null,
  ToolErrorCard: () => null,
  ToolInvalidResultCard: () => null,
}));
jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils/toolResult'),
  isToolPending: (s: string) => s === 'inProgress',
}));

const mockSafeParse = jest.fn<{ success: boolean; data?: unknown }, unknown[]>(() => ({
  success: false,
}));
jest.mock('@repo/schemas', () => ({
  RouteResultSchema: { safeParse: (arg: unknown) => mockSafeParse(arg) },
}));

beforeEach(() => {
  jest.mocked(useRenderToolCall).mockClear();
  mockSafeParse.mockReturnValue({ success: false });
});

describe('useRouteAction', () => {
  it('registers with the routeTool name', () => {
    renderHook(() => useRouteAction());
    expect(jest.mocked(useRenderToolCall)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'routeTool' })
    );
  });

  it('render returns LoadingCard when status is pending', () => {
    renderHook(() => useRouteAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'inProgress', args: {}, result: undefined });
    expect(result).not.toBeNull();
  });

  it('render returns ToolInvalidResultCard when safeParse fails', () => {
    mockSafeParse.mockReturnValue({ success: false });
    renderHook(() => useRouteAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', args: {}, result: {} });
    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns an explicit empty state when stops array is empty', () => {
    mockSafeParse.mockReturnValue({
      success: true,
      data: { city: 'Da Nang', stops: [], legs: [], totalDurationMin: 0 },
    });
    renderHook(() => useRouteAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', args: {}, result: { stops: [] } });
    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns RouteCard when parse succeeds with stops', () => {
    const routeData = {
      city: 'Da Nang',
      totalDurationMin: 240,
      travelTip: 'Bring water',
      stops: [
        { name: 'Marble Mountains', city: 'Da Nang' },
        { name: 'Dragon Bridge', city: 'Da Nang' },
      ],
      legs: [{ mode: 'walk', durationMin: 15, distanceKm: 1.2 }],
    };
    mockSafeParse.mockReturnValue({ success: true, data: routeData });
    renderHook(() => useRouteAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', args: {}, result: routeData });
    expect(result).not.toBeNull();
    const [card] = (result as React.ReactElement<{ children: React.ReactNode[] }>).props.children;
    expect(card).not.toBeNull();
  });
});
