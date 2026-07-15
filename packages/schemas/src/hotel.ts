import { z } from 'zod';

export const Hotel = z.object({
  id: z.string(),
  shortCode: z.string(),
  code: z.string(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  address: z.string(),
  starRating: z.number(),
  pricePerNight: z.number(),
  currency: z.string(),
  amenities: z.array(z.string()),
  rating: z.number(),
  reviewCount: z.number(),
  imageUrl: z.string(),
});

export const HotelAvailabilitySchema = z.object({
  id: z.string(),
  shortCode: z.string(),
  code: z.string(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  address: z.string(),
  starRating: z.number(),
  pricePerNight: z.number(),
  currency: z.string(),
  amenities: z.array(z.string()),
  rating: z.number(),
  reviewCount: z.number(),
  imageUrl: z.string(),
  available: z.boolean(),
  availableRooms: z.number(),
  maxOccupancyPerRoom: z.number(),
  nights: z.number(),
  totalPrice: z.number(),
});

export const HotelSearchResultSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  results: z.array(HotelAvailabilitySchema),
  search: z.object({
    city: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    nights: z.number(),
    rooms: z.number(),
    adults: z.number().optional(),
    children: z.number().optional(),
  }),
});

export const HotelToolOutputSchema = z.object({
  total: z.number(),
  results: z.array(Hotel),
});

export type HotelAvailability = z.infer<typeof HotelAvailabilitySchema>;
export type HotelSearchResult = z.infer<typeof HotelSearchResultSchema>;
