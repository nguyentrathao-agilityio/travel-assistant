import { z } from 'zod';

// Utils
import { isValidIsoDate, todayIso } from '@/utils/date';
import { stripNulls } from '@/utils/schema';

const HotelInputShape = z.object({
  city: z.string().trim().min(1).describe('City name to search, e.g. "Da Nang" or "Bangkok"'),
  checkIn: z
    .string()
    .refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date')
    .describe('Check-in date in YYYY-MM-DD format'),
  checkOut: z
    .string()
    .refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date')
    .describe('Check-out date in YYYY-MM-DD format'),
  rooms: z.number().int().optional().default(1).describe('Number of rooms needed (1-10)'),
  adults: z.number().int().optional().default(2).describe('Number of adults (1-20)'),
  children: z.number().int().optional().default(0).describe('Number of children'),
  availableOnly: z.boolean().optional().default(true).describe('Only return available hotels'),
  minStars: z.number().int().optional().describe('Minimum star rating (1-5)'),
  maxPrice: z.number().positive().optional().describe('Maximum price per night in USD'),
  amenities: z
    .array(z.string())
    .optional()
    .describe('Required amenities (e.g. ["wifi", "pool", "breakfast"])'),
  limit: z
    .number()
    .int()
    .optional()
    .default(20)
    .describe('Maximum number of results to return (1-100)'),
  offset: z.number().int().optional().default(0).describe('Pagination offset'),
});

/** Business-rule checks applied on top of {@link HotelInputShape}. */
const refineHotelInput = (data: z.infer<typeof HotelInputShape>, ctx: z.RefinementCtx) => {
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

  if (data.rooms < 1 || data.rooms > 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'rooms must be between 1 and 10',
      path: ['rooms'],
    });
  }

  if (data.adults < 1 || data.adults > 20) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'adults must be between 1 and 20',
      path: ['adults'],
    });
  }

  if (data.children < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'children must not be negative',
      path: ['children'],
    });
  }

  if (data.minStars !== undefined && (data.minStars < 1 || data.minStars > 5)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'minStars must be between 1 and 5',
      path: ['minStars'],
    });
  }

  if (data.limit < 1 || data.limit > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'limit must be between 1 and 100',
      path: ['limit'],
    });
  }

  if (data.offset < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'offset must not be negative',
      path: ['offset'],
    });
  }
};

/** Structural schema for the `tool()` config — safe for LangChain's pre-handler validation. */
export const HotelToolSchema = z.preprocess(stripNulls, HotelInputShape);

/** Full schema, including business rules — re-validated inside the tool handler. */
export const HotelInputSchema = z.preprocess(
  stripNulls,
  HotelInputShape.superRefine(refineHotelInput)
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
