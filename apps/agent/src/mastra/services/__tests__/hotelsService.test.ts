import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { searchHotels } from '../hotelsService';
import { API_URL, createMswServer } from '../../../test/mswServer';
import { apiHotel, apiHotelsResponse, hotelInput } from './mocks/hotels.mock';

const server = createMswServer();

describe('searchHotels', () => {
  it('returns camelCase hotel data from API', async () => {
    server.use(
      http.get(`${API_URL}/hotels/availability`, () => HttpResponse.json(apiHotelsResponse()))
    );

    const result = await searchHotels(hotelInput);

    expect(result.total).toBe(1);
    expect(result.results[0]).toEqual({
      id: apiHotel.id,
      shortCode: apiHotel.short_code,
      code: apiHotel.code,
      name: apiHotel.name,
      city: apiHotel.city,
      country: apiHotel.country,
      address: apiHotel.address,
      starRating: apiHotel.star_rating,
      pricePerNight: apiHotel.price_per_night,
      currency: apiHotel.currency,
      amenities: apiHotel.amenities,
      rating: apiHotel.rating,
      reviewCount: apiHotel.review_count,
      imageUrl: apiHotel.image_url,
      available: apiHotel.available,
      availableRooms: apiHotel.available_rooms,
      maxOccupancyPerRoom: apiHotel.max_occupancy_per_room,
      nights: apiHotel.nights,
      totalPrice: apiHotel.total_price,
    });
    expect(result.search.checkIn).toBe('2026-08-10');
  });

  it('returns empty results when no hotels match', async () => {
    server.use(
      http.get(`${API_URL}/hotels/availability`, () => HttpResponse.json(apiHotelsResponse([])))
    );

    const result = await searchHotels(hotelInput);

    expect(result.total).toBe(0);
    expect(result.results).toHaveLength(0);
  });

  it('throws when the API returns a non-OK status', async () => {
    server.use(
      http.get(`${API_URL}/hotels/availability`, () => new HttpResponse(null, { status: 500 }))
    );

    await expect(searchHotels(hotelInput)).rejects.toThrow('Hotel API failed');
  });

  it('throws when the API returns an invalid response shape', async () => {
    server.use(
      http.get(`${API_URL}/hotels/availability`, () => HttpResponse.json({ bad: 'data' }))
    );

    await expect(searchHotels(hotelInput)).rejects.toThrow('Invalid hotel response shape');
  });
});
