import React from 'react';
import { renderHook } from '@testing-library/react';
import { useRenderTool } from '@copilotkit/react-core/v2';
import { useWeatherAction } from '@/hooks/useWeatherAction';

jest.mock('@/constants', () => ({ TOOL_NAMES: { WEATHER: 'weatherTool' } }));
jest.mock('@/components', () => ({
  WeatherCard: () => null,
  LoadingCard: () => null,
  ToolLoading: () => null,
  ToolErrorCard: () => null,
  ToolInvalidResultCard: () => null,
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

  return jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
    props: Record<string, unknown>
  ) => React.ReactElement;
};

beforeEach(() => {
  jest.mocked(useRenderTool).mockClear();
  mockSafeParse.mockReturnValue({ success: false });
});

describe('useWeatherAction', () => {
  it('registers with the weatherTool name', () => {
    renderHook(() => useWeatherAction());
    expect(jest.mocked(useRenderTool)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'weatherTool' })
    );
  });

  it('render returns ToolLoading when status is pending', () => {
    const render = getRender();
    const result = render({ status: 'inProgress', parameters: {}, result: undefined });

    expect(result).not.toBeNull();
  });

  it('render returns ToolInvalidResultCard when safeParse fails', () => {
    const render = getRender();
    const result = render({ status: 'complete', parameters: {}, result: {} });

    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns WeatherCard when safeParse succeeds', () => {
    const fakeData = { city: 'Da Nang', forecast: [] };

    mockSafeParse.mockReturnValue({ success: true, data: fakeData });
    const render = getRender();
    const result = render({ status: 'complete', parameters: {}, result: fakeData });
    const [card] = (result as React.ReactElement<{ children: React.ReactNode[] }>).props.children;

    expect(card).not.toBeNull();
  });
});
