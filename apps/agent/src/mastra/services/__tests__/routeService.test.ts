import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { getRoute } from '../routeService';
import { API_URL, createMswServer } from '../../../test/mswServer';
import { makePlaces, routeLeg } from './mocks/route.mock';

const server = createMswServer();

describe('getRoute', () => {
  it('returns a route with stops and legs', async () => {
    const placesNumber = 3;
    const places = makePlaces(placesNumber);
    server.use(
      http.get(`${API_URL}/places/search`, () => HttpResponse.json({ results: places })),
      http.get(`${API_URL}/places/route`, () => HttpResponse.json(routeLeg))
    );

    const result = await getRoute({ city: 'Da Nang', maxStops: placesNumber });

    expect(result.city).toBe(places[0].city);
    expect(result.stops).toHaveLength(placesNumber);
    expect(result.legs).toHaveLength(placesNumber - 1);
    expect(result.legs[0].mode).toBe(routeLeg.recommended_mode);
    expect(result.legs[0].durationMin).toBe(routeLeg.legs[0].duration_minutes);
    expect(result.totalDurationMin).toBeGreaterThan(0);
  });

  it('includes stops without legs when route API returns null', async () => {
    const placesNumber = 2;
    server.use(
      http.get(`${API_URL}/places/search`, () =>
        HttpResponse.json({ results: makePlaces(placesNumber) })
      ),
      http.get(`${API_URL}/places/route`, () => new HttpResponse(null, { status: 404 }))
    );

    const result = await getRoute({ city: 'Da Nang', maxStops: placesNumber });

    expect(result.stops).toHaveLength(placesNumber);
    expect(result.legs).toHaveLength(0);
  });

  it('throws when no places are found for the city', async () => {
    server.use(http.get(`${API_URL}/places/search`, () => HttpResponse.json({ results: [] })));

    await expect(getRoute({ city: 'Nowhere' })).rejects.toThrow('No places found');
  });

  it('throws when the places API fails', async () => {
    server.use(http.get(`${API_URL}/places/search`, () => new HttpResponse(null, { status: 500 })));

    await expect(getRoute({ city: 'Da Nang' })).rejects.toThrow();
  });
});
