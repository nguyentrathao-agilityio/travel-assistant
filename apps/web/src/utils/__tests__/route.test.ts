import { toTravelLeg, toMapsUrl, chunk, getSlot } from '@/utils/route';
import type { TourLeg } from '@repo/types';

const makeLeg = (overrides: Partial<TourLeg> = {}): TourLeg => ({
  mode: 'walk',
  durationMin: 10,
  distanceKm: 0.8,
  ...overrides,
});

describe('toTravelLeg', () => {
  it('maps mode to transport', () => {
    expect(toTravelLeg(makeLeg({ mode: 'taxi' })).transport).toBe('taxi');
  });

  it('preserves durationMin and distanceKm', () => {
    const result = toTravelLeg(makeLeg({ durationMin: 25, distanceKm: 2.5 }));

    expect(result.durationMin).toBe(25);
    expect(result.distanceKm).toBe(2.5);
  });
});

describe('toMapsUrl', () => {
  it('returns a Google Maps URL for valid coordinates', () => {
    const url = toMapsUrl(16.047, 108.206);

    expect(url).toBe('https://www.google.com/maps?q=16.047,108.206');
  });

  it('returns null when lat is undefined', () => {
    expect(toMapsUrl(undefined, 108.206)).toBeNull();
  });

  it('returns null when lng is undefined', () => {
    expect(toMapsUrl(16.047, undefined)).toBeNull();
  });

  it('returns null when both are undefined', () => {
    expect(toMapsUrl()).toBeNull();
  });
});

describe('chunk', () => {
  it('splits an array into chunks of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns the whole array in one chunk when size >= length', () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it('returns empty array for empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('handles chunk size of 1', () => {
    expect(chunk(['a', 'b', 'c'], 1)).toEqual([['a'], ['b'], ['c']]);
  });
});

describe('getSlot', () => {
  it('returns morning for the first stop', () => {
    expect(getSlot(0, 6)).toBe('morning');
  });

  it('returns afternoon for a middle stop', () => {
    expect(getSlot(2, 6)).toBe('afternoon');
  });

  it('returns evening for the last stop', () => {
    expect(getSlot(5, 6)).toBe('evening');
  });

  it('returns morning for a single stop (avoids division by zero)', () => {
    expect(getSlot(0, 1)).toBe('morning');
  });

  it('returns morning for total=0 edge case', () => {
    expect(getSlot(0, 0)).toBe('morning');
  });
});
