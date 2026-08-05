import { z } from 'zod';

// Utils
import { isValidIsoDate, todayIso } from '@/utils/date';
import { stripNulls } from '@/utils/schema';

export const HotelInputSchema = z.preprocess(
  stripNulls,
  z
    .object({
      city: z.string().trim().min(1).describe('City name to search, e.g. "Da Nang" or "Bangkok"'),
      checkIn: z
        .string()
        .refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date')
        .describe('Check-in date in YYYY-MM-DD format'),
      checkOut: z
        .string()
        .refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date')
        .describe('Check-out date in YYYY-MM-DD format'),
      rooms: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .default(1)
        .describe('Number of rooms needed'),
      adults: z.number().int().min(1).max(20).optional().default(2).describe('Number of adults'),
      children: z.number().int().min(0).optional().default(0).describe('Number of children'),
      availableOnly: z.boolean().optional().default(true).describe('Only return available hotels'),
      minStars: z.number().int().min(1).max(5).optional().describe('Minimum star rating (1-5)'),
      maxPrice: z.number().positive().optional().describe('Maximum price per night in USD'),
      amenities: z
        .array(z.string())
        .optional()
        .describe('Required amenities (e.g. ["wifi", "pool", "breakfast"])'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(20)
        .describe('Maximum number of results to return'),
      offset: z.number().int().min(0).optional().default(0).describe('Pagination offset'),
    })
    .superRefine((data, ctx) => {
      const today = todayIso();
      if (data.checkIn < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `checkIn must not be in the past. Today is ${today} — use today or a future date.`,
          path: ['checkIn'],
        });
      }
      if (data.checkOut <= data.checkIn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'checkOut must be after checkIn',
          path: ['checkOut'],
        });
      }
    })
);

export type HotelInput = z.infer<typeof HotelInputSchema>;

// Response schema from the hotel API (snake_case)
export const HotelAvailabilityResponseSchema = z.object({
  id: z.string(),
  short_code: z.string(),
  code: z.string(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  address: z.string(),
  star_rating: z.number(),
  price_per_night: z.number(),
  currency: z.string(),
  amenities: z.array(z.string()),
  rating: z.number(),
  review_count: z.number(),
  image_url: z.string(),
  available: z.boolean(),
  available_rooms: z.number(),
  max_occupancy_per_room: z.number(),
  nights: z.number(),
  total_price: z.number(),
});

export const HotelSearchResponseSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  results: z.array(HotelAvailabilityResponseSchema),
  search: z.object({
    city: z.string(),
    check_in: z.string(),
    check_out: z.string(),
    nights: z.number(),
    rooms: z.number(),
    adults: z.number().optional(),
    children: z.number().optional(),
  }),
});

export type HotelAvailabilityResponse = z.infer<typeof HotelAvailabilityResponseSchema>;
export type HotelSearchResponse = z.infer<typeof HotelSearchResponseSchema>;

// Camel-case tool output.
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

export type HotelAvailability = z.infer<typeof HotelAvailabilitySchema>;
export type HotelSearchResult = z.infer<typeof HotelSearchResultSchema>;
