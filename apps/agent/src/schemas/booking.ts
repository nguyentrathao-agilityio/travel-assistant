import { z } from 'zod';

// Constants
import { BOOKING_STATUSES, BOOKING_TYPES } from '@repo/constants';

// Utils
import { isValidIsoDate } from '@/utils/date';
import { stripNulls } from '@/utils/schema';

const ContactSchema = z.object({
  customerName: z.string().trim().min(1),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().min(5),
  notes: z.string().trim().optional(),
});

export const FlightBookingInputSchema = z.preprocess(
  stripNulls,
  ContactSchema.extend({
    flightId: z.string().trim().min(1),
    adults: z.number().int().min(1).default(1),
  })
);

export const HotelBookingInputSchema = z.preprocess(
  stripNulls,
  ContactSchema.extend({
    hotelId: z.string().trim().min(1),
    city: z.string().trim().min(1),
    checkIn: z.string().refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date'),
    checkOut: z.string().refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date'),
    rooms: z.number().int().min(1).default(1),
    adults: z.number().int().min(1).default(2),
    children: z.number().int().min(0).default(0),
  }).refine((input) => input.checkOut > input.checkIn, {
    message: 'checkOut must be after checkIn',
    path: ['checkOut'],
  })
);

export const CancelBookingInputSchema = z.object({
  bookingId: z.string().trim().min(1),
});

export const ApiBookingSchema = z.object({
  id: z.string(),
  confirmation_code: z.string(),
  type: z.enum([BOOKING_TYPES.FLIGHT, BOOKING_TYPES.HOTEL]),
  reference_id: z.string(),
  customer_name: z.string(),
  customer_email: z.string(),
  total_price: z.number(),
  currency: z.string(),
  status: z.enum([BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.CANCELLED]),
  created_at: z.string(),
  details: z.record(z.unknown()).optional(),
  notes: z.string().nullish(),
  summary: z.string(),
});

export const BookingSchema = z.object({
  id: z.string(),
  confirmationCode: z.string(),
  type: z.enum([BOOKING_TYPES.FLIGHT, BOOKING_TYPES.HOTEL]),
  referenceId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  totalPrice: z.number(),
  currency: z.string(),
  status: z.enum([BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.CANCELLED]),
  createdAt: z.string(),
  details: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
  summary: z.string(),
});

export type FlightBookingInput = z.infer<typeof FlightBookingInputSchema>;
export type HotelBookingInput = z.infer<typeof HotelBookingInputSchema>;
export type CancelBookingInput = z.infer<typeof CancelBookingInputSchema>;
export type Booking = z.infer<typeof BookingSchema>;
