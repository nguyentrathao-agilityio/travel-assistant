export const makePlaces = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `PL00${i + 1}`,
    name: `Place ${i + 1}`,
    city: 'Da Nang',
    category: 'attraction',
    description: `Description ${i + 1}`,
    price_level: 1,
    latitude: 16.06 + i * 0.01,
    longitude: 108.22 + i * 0.01,
  }));

export const routeLeg = {
  straight_line_km: 2.1,
  recommended_mode: 'walk',
  legs: [{ mode: 'walk', distance_km: 2.3, duration_minutes: 28 }],
};
