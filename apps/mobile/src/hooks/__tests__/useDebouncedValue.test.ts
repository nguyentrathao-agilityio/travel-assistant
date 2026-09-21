import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from '../useDebouncedValue';

jest.useFakeTimers();

test('returns the initial value immediately', async () => {
  const { result } = await renderHook(() => useDebouncedValue('first', 300));

  expect(result.current).toBe('first');
});

test('only updates after the delay has elapsed with no further changes', async () => {
  const { result, rerender } = await renderHook(
    ({ value }: { value: string }) => useDebouncedValue(value, 300),
    { initialProps: { value: 'a' } }
  );

  await rerender({ value: 'ab' });
  expect(result.current).toBe('a');

  await act(async () => {
    jest.advanceTimersByTime(299);
  });
  expect(result.current).toBe('a');

  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(result.current).toBe('ab');
});

test('resets the timer on every change, only settling on the last value', async () => {
  const { result, rerender } = await renderHook(
    ({ value }: { value: string }) => useDebouncedValue(value, 300),
    { initialProps: { value: 'a' } }
  );

  await rerender({ value: 'ab' });
  await act(async () => {
    jest.advanceTimersByTime(200);
  });
  await rerender({ value: 'abc' });
  await act(async () => {
    jest.advanceTimersByTime(200);
  });
  expect(result.current).toBe('a');

  await act(async () => {
    jest.advanceTimersByTime(100);
  });
  expect(result.current).toBe('abc');
});

test('updating the delay does not affect an already-settled value', async () => {
  const { result, rerender } = await renderHook(
    ({ value, delayMs }: { value: string; delayMs: number }) => useDebouncedValue(value, delayMs),
    { initialProps: { value: 'x', delayMs: 300 } }
  );

  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  expect(result.current).toBe('x');

  await rerender({ value: 'x', delayMs: 50 });
  await act(async () => {
    jest.advanceTimersByTime(50);
  });
  expect(result.current).toBe('x');
});
