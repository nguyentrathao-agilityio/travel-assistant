import React from 'react';
import { renderHook } from '@testing-library/react';
import { useRenderTool } from '@copilotkit/react-core/v2';
import { usePlacesAction } from '@/hooks/usePlacesAction';

jest.mock('@/constants', () => ({
  TOOL_NAMES: { PLACES: 'placesTool' },
  PLACES_LOADING_SKELETON_COUNT: 3,
}));
jest.mock('@/components', () => ({
  PlacesCard: () => null,
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
  PlacesSearchResultSchema: { safeParse: (arg: unknown) => mockSafeParse(arg) },
}));

beforeEach(() => {
  jest.mocked(useRenderTool).mockClear();
  mockSafeParse.mockReturnValue({ success: false });
});

describe('usePlacesAction', () => {
  it('registers with the placesTool name', () => {
    renderHook(() => usePlacesAction());
    expect(jest.mocked(useRenderTool)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'placesTool' })
    );
  });

  it('render returns LoadingCard when status is pending', () => {
    renderHook(() => usePlacesAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;
    const result = render({ status: 'inProgress', parameters: {}, result: undefined });

    expect(result).not.toBeNull();
  });

  it('render returns ToolInvalidResultCard when safeParse fails', () => {
    mockSafeParse.mockReturnValue({ success: false });
    renderHook(() => usePlacesAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;
    const result = render({ status: 'complete', parameters: {}, result: {} });

    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns an explicit empty state when total is 0', () => {
    mockSafeParse.mockReturnValue({ success: true, data: { total: 0, results: [] } });
    renderHook(() => usePlacesAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;
    const result = render({
      status: 'complete',
      parameters: {},
      result: { total: 0, results: [] },
    });

    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns PlacesCard when parse succeeds with results', () => {
    const placesData = {
      total: 1,
      results: [
        {
          id: 'p1',
          shortCode: 'MB',
          name: 'Marble Mountains',
          city: 'Da Nang',
          country: 'Vietnam',
          category: 'attraction',
          description: 'A cluster of marble hills.',
          address: '1 Huyen Tran Cong Chua',
          rating: 4.5,
          reviewCount: 1500,
          priceLevel: 1,
          imageUrl: '',
          tags: ['nature'],
          isRecommended: true,
        },
      ],
    };

    mockSafeParse.mockReturnValue({ success: true, data: placesData });
    renderHook(() => usePlacesAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;
    const result = render({ status: 'complete', parameters: {}, result: placesData });

    expect(result).not.toBeNull();
    const [card] = (result as React.ReactElement<{ children: React.ReactNode[] }>).props.children;

    expect(card).not.toBeNull();
  });

  it('parses a persisted JSON result before schema validation', () => {
    const placesData = { total: 1, results: [{ id: 'p1' }] };

    mockSafeParse.mockReturnValue({ success: true, data: placesData });
    renderHook(() => usePlacesAction());
    const render = jest.mocked(useRenderTool).mock.calls[0][0].render as unknown as (
      props: Record<string, unknown>
    ) => React.ReactElement;

    render({ status: 'complete', parameters: {}, result: JSON.stringify(placesData) });

    expect(mockSafeParse).toHaveBeenCalledWith(placesData);
  });
});
