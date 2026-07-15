import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { searchFlights } from '../flightsService';
import { API_URL, createMswServer } from '../../../test/mswServer';
import { apiFlight, apiFlightsResponse, flightInput } from './mocks/flights.mock';

const server = createMswServer();

describe('searchFlights', () => {
  it('returns camelCase flight data from API', async () => {
    server.use(
      http.get(`${API_URL}/flights/search`, () => HttpResponse.json(apiFlightsResponse()))
    );

    const result = await searchFlights(flightInput);

    expect(result.count).toBe(1);
    expect(result.results[0]).toEqual({
      id: apiFlight.id,
      airline: { code: apiFlight.airline.code, name: apiFlight.airline.name },
      flightNumber: apiFlight.flight_number,
      origin: apiFlight.origin,
      destination: apiFlight.destination,
      departureTime: apiFlight.departure_time,
      arrivalTime: apiFlight.arrival_time,
      durationMinutes: apiFlight.duration_minutes,
      price: apiFlight.price,
      currency: apiFlight.currency,
      seatsAvailable: apiFlight.seats_available,
      stops: apiFlight.stops,
    });
  });

  it('includes returnResults when round-trip data is present', async () => {
    const returnFlight = {
      ...apiFlight,
      id: 'FL002',
      flight_number: 'VN235',
      origin: 'DAD',
      destination: 'HAN',
    };
    server.use(
      http.get(`${API_URL}/flights/search`, () =>
        HttpResponse.json({
          count: 1,
          results: [apiFlight],
          return_count: 1,
          return_results: [returnFlight],
        })
      )
    );

    const result = await searchFlights({ ...flightInput, return_date: '2026-08-05' });

    expect(result.returnCount).toBe(1);
    expect(result.returnResults?.[0].flightNumber).toBe('VN235');
  });

  it('throws when the API returns a non-OK status', async () => {
    server.use(
      http.get(`${API_URL}/flights/search`, () => new HttpResponse(null, { status: 503 }))
    );

    await expect(searchFlights(flightInput)).rejects.toThrow('503');
  });

  it('throws when the API returns an invalid response shape', async () => {
    server.use(http.get(`${API_URL}/flights/search`, () => HttpResponse.json({ invalid: true })));

    await expect(searchFlights(flightInput)).rejects.toThrow();
  });
});
