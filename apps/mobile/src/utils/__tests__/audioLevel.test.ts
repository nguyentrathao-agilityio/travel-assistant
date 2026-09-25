import { calculateMicLevel } from '../voice';

test('returns zero for an empty audio buffer', () => {
  expect(calculateMicLevel(new ArrayBuffer(0), 5)).toBe(0);
});

test('calculates amplified normalized RMS and caps it at one', () => {
  const quiet = new Int16Array([1000, -1000]);
  const loud = new Int16Array([30000, -30000]);

  expect(calculateMicLevel(quiet.buffer, 5)).toBeCloseTo((1000 / 32768) * 5);
  expect(calculateMicLevel(loud.buffer, 5)).toBe(1);
});
