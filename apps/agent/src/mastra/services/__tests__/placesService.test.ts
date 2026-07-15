import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { getPlaces } from '../placesService';
import { API_URL, createMswServer } from '../../../test/mswServer';
import { apiPlace, apiPlacesResponse } from './mocks/places.mock';

const server = createMswServer();

describe('getPlaces', () => {
  it('returns camelCase place data from API', async () => {
    server.use(http.get(`${API_URL}/places/search`, () => HttpResponse.json(apiPlacesResponse())));

    const result = await getPlaces({ city: 'Da Nang' });

    expect(result.total).toBe(1);
    expect(result.results[0]).toEqual({
      id: apiPlace.id,
      shortCode: apiPlace.short_code,
      name: apiPlace.name,
      city: apiPlace.city,
      country: apiPlace.country,
      category: apiPlace.category,
      description: apiPlace.description,
      address: apiPlace.address,
      rating: apiPlace.rating,
      reviewCount: apiPlace.review_count,
      priceLevel: apiPlace.price_level,
      openingHours: apiPlace.opening_hours,
      imageUrl: apiPlace.image_url,
      tags: apiPlace.tags,
      isRecommended: apiPlace.is_recommended,
      latitude: apiPlace.latitude,
      longitude: apiPlace.longitude,
    });
  });

  it('filters by category when provided', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${API_URL}/places/search`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(apiPlacesResponse());
      })
    );

    await getPlaces({ city: 'Da Nang', category: 'restaurant' });

    expect(capturedUrl).toContain('category=restaurant');
  });

  it('returns empty results when API has no data', async () => {
    server.use(
      http.get(`${API_URL}/places/search`, () => HttpResponse.json(apiPlacesResponse([])))
    );

    const result = await getPlaces({ city: 'Da Nang' });

    expect(result.total).toBe(0);
    expect(result.results).toHaveLength(0);
  });

  it('throws when the API returns a non-OK status', async () => {
    server.use(http.get(`${API_URL}/places/search`, () => new HttpResponse(null, { status: 404 })));

    await expect(getPlaces({ city: 'Unknown' })).rejects.toThrow();
  });
});
