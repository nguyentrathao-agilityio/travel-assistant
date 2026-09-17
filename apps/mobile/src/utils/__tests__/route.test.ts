import { toMapsUrl } from '../route';

test.each([
  ['valid coordinates', 21.0285, 105.8542, '21.0285,105.8542'],
  ['negative coordinates', -33.8688, 151.2093, '-33.8688,151.2093'],
  ['zero coordinates', 0, 0, '0,0'],
])('builds a Google Maps search URL from %s', (_label, lat, lng, query) => {
  expect(toMapsUrl(lat, lng)).toBe(`https://www.google.com/maps/search/?api=1&query=${query}`);
});

test('returns null when lat is missing', () => {
  expect(toMapsUrl(undefined, 105.8542)).toBeNull();
});

test('returns null when lng is missing', () => {
  expect(toMapsUrl(21.0285, undefined)).toBeNull();
});

test('returns null when both are missing', () => {
  expect(toMapsUrl()).toBeNull();
});

test('returns null when lat or lng is not a number type', () => {
  expect(toMapsUrl('21.0285' as unknown as number, 105.8542)).toBeNull();
  expect(toMapsUrl(21.0285, '105.8542' as unknown as number)).toBeNull();
});
