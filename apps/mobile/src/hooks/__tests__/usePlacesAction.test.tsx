import { renderHook } from '@testing-library/react-native';

import { TOOL_NAMES } from '@repo/constants';

import { EmptyState, ErrorState, LoadingState } from '../../components/common';
import { PlacesCard } from '../../components/PlacesCard';
import { usePlacesAction } from '../usePlacesAction';

const mockUseRenderToolResult = jest.fn();

jest.mock('../useRenderToolResult', () => ({
  useRenderToolResult: (options: unknown) => mockUseRenderToolResult(options),
}));

beforeEach(() => {
  mockUseRenderToolResult.mockClear();
});

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

test('registers with the placesTool name', async () => {
  await renderHook(() => usePlacesAction());

  expect(mockUseRenderToolResult).toHaveBeenCalledWith(
    expect.objectContaining({ name: TOOL_NAMES.PLACES })
  );
});

test('render returns LoadingState while the tool call is in progress', async () => {
  await renderHook(() => usePlacesAction());
  const { render } = mockUseRenderToolResult.mock.calls[0][0];

  const result = render({ status: 'inProgress', result: undefined, args: {} });

  expect(result.type).toBe(LoadingState);
});

test('render returns ErrorState when the schema fails to parse', async () => {
  await renderHook(() => usePlacesAction());
  const { render } = mockUseRenderToolResult.mock.calls[0][0];

  const result = render({ status: 'complete', result: { unexpected: true }, args: {} });

  expect(result.type).toBe(ErrorState);
});

test('render returns EmptyState when no places matched', async () => {
  await renderHook(() => usePlacesAction());
  const { render } = mockUseRenderToolResult.mock.calls[0][0];

  const result = render({ status: 'complete', result: { total: 0, results: [] }, args: {} });

  expect(result.type).toBe(EmptyState);
});

test('render returns PlacesCard when parse succeeds with results', async () => {
  await renderHook(() => usePlacesAction());
  const { render } = mockUseRenderToolResult.mock.calls[0][0];

  const result = render({ status: 'complete', result: placesData, args: {} });

  expect(result.type).toBe(PlacesCard);
  expect(result.props.data).toEqual(placesData);
});

test('render parses a persisted JSON string result before validating', async () => {
  await renderHook(() => usePlacesAction());
  const { render } = mockUseRenderToolResult.mock.calls[0][0];

  const result = render({ status: 'complete', result: JSON.stringify(placesData), args: {} });

  expect(result.type).toBe(PlacesCard);
});
