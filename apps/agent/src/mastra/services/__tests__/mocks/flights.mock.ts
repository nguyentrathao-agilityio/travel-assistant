export const apiFlight = {
  id: 'FL001',
  airline: { code: 'VN', name: 'Vietnam Airlines' },
  flight_number: 'VN234',
  origin: 'HAN',
  destination: 'DAD',
  departure_time: '2026-08-01T07:00:00',
  arrival_time: '2026-08-01T08:20:00',
  duration_minutes: 80,
  price: 45,
  currency: 'USD',
  seats_available: 12,
  stops: 0,
};

export const apiFlightsResponse = (results = [apiFlight]) => ({
  count: results.length,
  results,
  return_count: null,
  return_results: null,
});

export const flightInput = {
  origin: 'HAN',
  destination: 'DAD',
  departure_date: '2026-08-01',
};
