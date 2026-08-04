import { createHash } from 'node:crypto';
import { z } from 'zod';

import { API_URL, ENDPOINTS, ERROR_MESSAGES } from '../constants';
import {
  ApiBookingSchema,
  ApiFlightSchema,
  BookingSchema,
  FlightBookingInputSchema,
  HotelBookingInputSchema,
  HotelSearchResponseSchema,
} from '../schemas';
import type {
  Booking,
  CancelBookingInput,
  FlightBookingInput,
  HotelBookingInput,
} from '../schemas';

type ApiBooking = z.infer<typeof ApiBookingSchema>;

const mapApiBooking = (apiBooking: ApiBooking): Booking => ({
  id: apiBooking.id,
  confirmationCode: apiBooking.confirmation_code,
  type: apiBooking.type,
  referenceId: apiBooking.reference_id,
  customerName: apiBooking.customer_name,
  customerEmail: apiBooking.customer_email,
  totalPrice: apiBooking.total_price,
  currency: apiBooking.currency,
  status: apiBooking.status,
  createdAt: apiBooking.created_at,
  ...(apiBooking.details && { details: apiBooking.details }),
  ...(apiBooking.notes && { notes: apiBooking.notes }),
  summary: apiBooking.summary,
});

const parseBookingResponse = async (response: Response): Promise<Booking> => {
  const responseBody: unknown = await response.json();
  const apiBooking = ApiBookingSchema.safeParse(responseBody);

  if (!apiBooking.success) throw new Error('Invalid booking response');

  const booking = BookingSchema.safeParse(mapApiBooking(apiBooking.data));
  if (!booking.success) throw new Error('Invalid mapped booking response');

  return booking.data;
};

// Deterministic hash of the request payload, not a random UUID, so an identical retry (e.g. the
// agent re-invoking the tool after a network blip) reuses the same key and the API can dedupe it
// instead of creating a duplicate booking.
const createIdempotencyKey = (action: string, payload: object): string =>
  createHash('sha256')
    .update(`${action}:${JSON.stringify(payload)}`)
    .digest('hex');

const request = async (path: string, init?: RequestInit): Promise<Response> => {
  if (!API_URL) throw new Error(ERROR_MESSAGES.NO_API_URL);
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${response.status} ${message || response.statusText}`);
  }
  return response;
};

/** Fetches a single flight by id. Throws if not found or the response shape is invalid. */
export const getFlight = async (flightId: string) => {
  const response = await request(`${ENDPOINTS.FLIGHTS}/${encodeURIComponent(flightId)}`);
  const responseBody: unknown = await response.json();
  const flight = ApiFlightSchema.safeParse(responseBody);

  if (!flight.success) throw new Error('Invalid flight response');

  return flight.data;
};

/**
 * Re-checks live availability for a previously selected hotel immediately before booking.
 * Throws if the hotel is no longer available or doesn't have enough rooms left.
 */
export const revalidateHotel = async (input: HotelBookingInput) => {
  const validated = HotelBookingInputSchema.parse(input);
  const params = new URLSearchParams({
    city: validated.city,
    check_in: validated.checkIn,
    check_out: validated.checkOut,
    rooms: String(validated.rooms),
    adults: String(validated.adults),
    children: String(validated.children),
    available_only: 'true',
  });
  const response = await request(`${ENDPOINTS.HOTELS}?${params.toString()}`);
  const responseBody: unknown = await response.json();
  const availability = HotelSearchResponseSchema.safeParse(responseBody);

  if (!availability.success) throw new Error('Invalid hotel availability response');

  const hotel = availability.data.results.find(({ id }) => id === validated.hotelId);
  if (!hotel?.available) throw new Error('The selected hotel is no longer available');
  if (hotel.available_rooms < validated.rooms) throw new Error('Not enough rooms are available');

  return hotel;
};

/** Creates a flight booking for an already-validated flight. Idempotent per identical payload. */
export const submitFlightBooking = async (
  input: FlightBookingInput,
  flight: {
    flight_number: string;
    origin: string;
    destination: string;
    departure_time: string;
  }
): Promise<Booking> => {
  const validated = FlightBookingInputSchema.parse(input);
  const payload = {
    flight_number: flight.flight_number,
    origin: flight.origin,
    destination: flight.destination,
    departure_date: flight.departure_time.slice(0, 10),
    passenger_name: validated.customerName,
    passenger_email: validated.customerEmail,
    passenger_phone: validated.customerPhone,
    ...(validated.notes && { notes: validated.notes }),
  };
  const response = await request(ENDPOINTS.FLIGHT_BOOKING, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': createIdempotencyKey('flight', payload),
    },
    body: JSON.stringify(payload),
  });
  return parseBookingResponse(response);
};

/** Creates a hotel booking. Idempotent per identical payload; does not re-check availability. */
export const submitHotelBooking = async (input: HotelBookingInput): Promise<Booking> => {
  const validated = HotelBookingInputSchema.parse(input);
  const payload = {
    hotel_id: validated.hotelId,
    check_in: validated.checkIn,
    check_out: validated.checkOut,
    rooms: validated.rooms,
    adults: validated.adults,
    children: validated.children,
    guest_name: validated.customerName,
    guest_email: validated.customerEmail,
    guest_phone: validated.customerPhone,
    ...(validated.notes && { notes: validated.notes }),
  };
  const response = await request(ENDPOINTS.HOTEL_BOOKING, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': createIdempotencyKey('hotel', payload),
    },
    body: JSON.stringify(payload),
  });
  return parseBookingResponse(response);
};

/** Fetches a booking by id. Throws if not found or the response shape is invalid. */
export const getBooking = async (bookingId: string): Promise<Booking> => {
  const response = await request(`${ENDPOINTS.BOOKINGS}/${encodeURIComponent(bookingId)}`);
  return parseBookingResponse(response);
};

/** Cancels a booking by id. Fetches it first purely to validate it exists, so an invalid id
 *  surfaces getBooking's error rather than an opaque failure from the cancel endpoint. */
export const cancelBooking = async (input: CancelBookingInput): Promise<Booking> => {
  await getBooking(input.bookingId);
  const response = await request(
    `${ENDPOINTS.BOOKINGS}/${encodeURIComponent(input.bookingId)}/cancel`,
    { method: 'POST' }
  );
  return parseBookingResponse(response);
};
