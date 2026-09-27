import { renderHook } from '@testing-library/react-native';
import { z } from 'zod';

import { useRenderToolResult } from '../useRenderToolResult';

import type { ReactElement } from 'react';

const mockAddHookRenderToolCall = jest.fn();
const mockDefineToolCallRenderer = jest.fn((config: unknown) => config);
const mockCopilotKitContext = { copilotkit: { addHookRenderToolCall: mockAddHookRenderToolCall } };

jest.mock('@copilotkit/react-native/headless', () => ({
  useCopilotKit: () => mockCopilotKitContext,
  defineToolCallRenderer: (config: unknown) => mockDefineToolCallRenderer(config),
}));

const schema = z.object({ city: z.string().optional() });

beforeEach(() => {
  mockAddHookRenderToolCall.mockClear();
  mockDefineToolCallRenderer.mockClear();
});

test('registers a tool call renderer with the given name and schema', async () => {
  const render = jest.fn();

  await renderHook(() => useRenderToolResult({ name: 'weatherTool', schema, render }));

  expect(mockDefineToolCallRenderer).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'weatherTool', args: schema })
  );
  expect(mockAddHookRenderToolCall).toHaveBeenCalledTimes(1);
});

test('wraps the provided render callback with status/result/args', async () => {
  const render = jest.fn((): ReactElement => null as unknown as ReactElement);

  await renderHook(() => useRenderToolResult({ name: 'weatherTool', schema, render }));

  const registered = mockAddHookRenderToolCall.mock.calls[0][0];

  registered.render({ status: 'complete', result: '{}', args: { city: 'Hanoi' } });

  expect(render).toHaveBeenCalledWith({
    status: 'complete',
    result: '{}',
    args: { city: 'Hanoi' },
  });
});

test('does not re-register when rerendered with the same deps', async () => {
  const render = jest.fn();

  const { rerender } = await renderHook(() =>
    useRenderToolResult({ name: 'weatherTool', schema, render })
  );

  expect(mockAddHookRenderToolCall).toHaveBeenCalledTimes(1);

  await rerender(undefined);

  expect(mockAddHookRenderToolCall).toHaveBeenCalledTimes(1);
});

test('delegates to the latest render callback without re-registering', async () => {
  const firstRender = jest.fn((): ReactElement => null as unknown as ReactElement);
  const latestRender = jest.fn((): ReactElement => null as unknown as ReactElement);

  const { rerender } = await renderHook(
    ({ render }: { render: typeof firstRender }) =>
      useRenderToolResult({ name: 'weatherTool', schema, render }),
    { initialProps: { render: firstRender } }
  );
  const registered = mockAddHookRenderToolCall.mock.calls[0][0];

  await rerender({ render: latestRender });
  registered.render({ status: 'complete', result: '{}', args: { city: 'Hanoi' } });

  expect(firstRender).not.toHaveBeenCalled();
  expect(latestRender).toHaveBeenCalledWith({
    status: 'complete',
    result: '{}',
    args: { city: 'Hanoi' },
  });
  expect(mockAddHookRenderToolCall).toHaveBeenCalledTimes(1);
});

test('re-registers when deps change', async () => {
  const render = jest.fn();

  const { rerender } = await renderHook(
    ({ deps }: { deps: unknown[] }) =>
      useRenderToolResult({ name: 'weatherTool', schema, render }, deps),
    { initialProps: { deps: [1] } }
  );

  expect(mockAddHookRenderToolCall).toHaveBeenCalledTimes(1);

  await rerender({ deps: [2] });

  expect(mockAddHookRenderToolCall).toHaveBeenCalledTimes(2);
});
