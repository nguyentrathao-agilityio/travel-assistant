import React from 'react';
import { renderHook } from '@testing-library/react';
import { useRenderToolCall } from '@copilotkit/react-core';
import { useLocalTipsAction } from '@/hooks/useLocalTipsAction';

jest.mock('@/constants', () => ({ TOOL_NAMES: { LOCAL_TIPS: 'localTipsTool' } }));
jest.mock('@/components', () => ({
  LocalTipsCard: () => null,
  ToolEmptyCard: () => null,
  ToolErrorCard: () => null,
  ToolInvalidResultCard: () => null,
  ToolLoading: () => null,
  SetLastTool: () => null,
}));
jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils/toolResult'),
  isToolPending: (s: string) => s === 'inProgress',
}));

const mockSafeParse = jest.fn<{ success: boolean; data?: unknown }, unknown[]>(() => ({
  success: false,
}));

jest.mock('@repo/schemas', () => ({
  TipsResultSchema: { safeParse: (arg: unknown) => mockSafeParse(arg) },
}));

beforeEach(() => {
  jest.mocked(useRenderToolCall).mockClear();
  mockSafeParse.mockReturnValue({ success: false });
});

describe('useLocalTipsAction', () => {
  it('registers with the localTipsTool name', () => {
    renderHook(() => useLocalTipsAction());
    expect(jest.mocked(useRenderToolCall)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'localTipsTool' })
    );
  });

  it('render returns LocalTipsCard (loading) when status is pending', () => {
    renderHook(() => useLocalTipsAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'inProgress', args: {}, result: undefined });

    expect(result).not.toBeNull();
  });

  it('render returns ToolInvalidResultCard when safeParse fails', () => {
    mockSafeParse.mockReturnValue({ success: false });
    renderHook(() => useLocalTipsAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', args: {}, result: {} });

    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns an explicit empty state when count is 0', () => {
    mockSafeParse.mockReturnValue({
      success: true,
      data: { count: 0, tips: [], country: 'Vietnam', summary: '' },
    });
    renderHook(() => useLocalTipsAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', args: {}, result: { count: 0 } });

    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns LocalTipsCard with data when parse succeeds and count > 0', () => {
    const tipsData = {
      country: 'Vietnam',
      count: 1,
      summary: 'Tips for Vietnam',
      tips: [
        {
          id: 't1',
          category: 'food',
          scope: 'city',
          title: 'Try Banh Mi',
          content: 'Delicious local food',
          isEssential: true,
          location: null,
        },
      ],
    };

    mockSafeParse.mockReturnValue({ success: true, data: tipsData });
    renderHook(() => useLocalTipsAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', args: {}, result: tipsData });

    expect(result).not.toBeNull();
  });
});
