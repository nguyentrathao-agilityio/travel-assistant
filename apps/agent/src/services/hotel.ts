import { z } from 'zod';

import { API_URL, ENDPOINTS } from '../constants';
import { HotelSearchResponseSchema, HotelSearchResultSchema } from '../schemas/hotel';

type HotelToolOutput = z.infer<typeof HotelSearchResultSchema>;

/**
 * Searches available hotels for a destination with flexible filters.
 */
export const searchHotels = async (inputData: {
  city: string;
  checkIn: string;
  checkOut: string;
  rooms?: number;
  adults?: number;
  children?: number;
  availableOnly?: boolean;
  minStars?: number;
  maxPrice?: number;
  amenities?: string[];
  limit?: number;
  offset?: number;
}): Promise<HotelToolOutput> => {
  const {
    city,
    checkIn,
    checkOut,
    rooms = 1,
    adults = 2,
    children = 0,
    availableOnly = false,
    minStars,
    maxPrice,
    amenities,
    limit = 20,
    offset = 0,
  } = inputData;

  const endpoint = `${API_URL}${ENDPOINTS.HOTELS}`;
  const params = new URLSearchParams({
    city: city.trim(),
    check_in: checkIn,
    check_out: checkOut,
    rooms: String(rooms),
    adults: String(adults),
    children: String(children),
    available_only: String(availableOnly),
    limit: String(limit),
    offset: String(offset),
  });

  if (!!minStars) params.append('min_stars', String(minStars));
  if (!!maxPrice) params.append('max_price', String(maxPrice));

  if (amenities && amenities.length > 0) {
    amenities.forEach((amenity) => params.append('amenities', amenity));
  }

  try {
    const res = await fetch(`${endpoint}?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`Hotel API failed: ${res.status} ${res.statusText}`);
    }

    const raw = await res.json();
    const parsed = HotelSearchResponseSchema.safeParse(raw);

    if (!parsed.success) {
      throw new Error(`Invalid hotel response shape: ${parsed.error.message}`);
    }

    const data = parsed.data;

    return {
      total: data.total,
      limit: data.limit,
      offset: data.offset,
      results: data.results.map((hotel) => ({
        id: hotel.id,
        shortCode: hotel.short_code,
        code: hotel.code,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        address: hotel.address,
        starRating: hotel.star_rating,
        pricePerNight: hotel.price_per_night,
        currency: hotel.currency,
        amenities: hotel.amenities,
        rating: hotel.rating,
        reviewCount: hotel.review_count,
        imageUrl: hotel.image_url,
        available: hotel.available,
        availableRooms: hotel.available_rooms,
        maxOccupancyPerRoom: hotel.max_occupancy_per_room,
        nights: hotel.nights,
        totalPrice: hotel.total_price,
      })),
      search: {
        city: data.search.city,
        checkIn: data.search.check_in,
        checkOut: data.search.check_out,
        nights: data.search.nights,
        rooms: data.search.rooms,
        adults: data.search.adults,
        children: data.search.children,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to search hotels: ${error.message}`);
    }
    throw new Error('Failed to search hotels: Unknown error');
  }
};
