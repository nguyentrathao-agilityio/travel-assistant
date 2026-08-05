import React from 'react';
import { renderHook } from '@testing-library/react';
import { useRenderToolCall } from '@copilotkit/react-core';
import { useWeatherAction } from '@/hooks/useWeatherAction';

jest.mock('@/constants', () => ({ TOOL_NAMES: { WEATHER: 'weatherTool' } }));
jest.mock('@/components', () => ({
  WeatherCard: () => null,
  LoadingCard: () => null,
  ToolLoading: () => null,
  ToolErrorCard: () => null,
  SetLastTool: () => null,
}));
jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils/toolResult'),
  isToolPending: (s: string) => s === 'inProgress',
}));

const mockSafeParse = jest.fn<{ success: boolean; data?: unknown }, [unknown]>(() => ({
  success: false,
}));
jest.mock('@repo/schemas', () => ({
  WeatherResultSchema: { safeParse: (arg: unknown) => mockSafeParse(arg) },
}));

const getRender = () => {
  renderHook(() => useWeatherAction());
  return jest.mocked(useRenderToolCall).mock.calls[0][0].render;
};

beforeEach(() => {
  jest.mocked(useRenderToolCall).mockClear();
  mockSafeParse.mockReturnValue({ success: false });
});

describe('useWeatherAction', () => {
  it('registers with the weatherTool name', () => {
    renderHook(() => useWeatherAction());
    expect(jest.mocked(useRenderToolCall)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'weatherTool' })
    );
  });

  it('render returns ToolLoading when status is pending', () => {
    const render = getRender();
    const result = render({ status: 'inProgress', args: {}, result: undefined });
    expect(result).not.toBeNull();
  });

  it('render returns empty fragment when safeParse fails', () => {
    const render = getRender();
    const result = render({ status: 'complete', args: {}, result: {} });
    expect(result.type).toBe(React.Fragment);
  });

  it('render returns WeatherCard when safeParse succeeds', () => {
    const fakeData = { city: 'Da Nang', forecast: [] };
    mockSafeParse.mockReturnValue({ success: true, data: fakeData });
    const render = getRender();
    const result = render({ status: 'complete', args: {}, result: fakeData });
    const [card] = (result as React.ReactElement<{ children: React.ReactNode[] }>).props.children;
    expect(card).not.toBeNull();
  });
});
