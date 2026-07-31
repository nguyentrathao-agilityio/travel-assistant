import { tool } from '@langchain/core/tools';
import { interrupt } from '@langchain/langgraph';
import type { BookingApprovalRequest } from '@repo/types';

import {
  cancelBooking,
  getBooking,
  getFlight,
  revalidateHotel,
  submitFlightBooking,
  submitHotelBooking,
} from '../services';
import {
  BookingApprovalResponseSchema,
  CancelBookingInputSchema,
  FlightBookingInputSchema,
  HotelBookingInputSchema,
} from '../schemas';
import { contentAndArtifact, TOOL_ERROR_MESSAGES } from '../constants';

const formatToolResult = (result: unknown): [string, unknown] => contentAndArtifact(result);

const parseApprovalResponse = (response: unknown): unknown => {
  if (typeof response !== 'string') return response;

  try {
    return JSON.parse(response) as unknown;
  } catch {
    return { decision: response };
  }
};

const requestBookingApproval = (request: BookingApprovalRequest): boolean => {
  const response = interrupt(request);

  return (
    BookingApprovalResponseSchema.parse(parseApprovalResponse(response)).decision === 'approve'
  );
};

const toolError = (error: unknown, fallbackMessage: string): { error: string } => ({
  error: error instanceof Error ? error.message : fallbackMessage,
});

type Flight = Awaited<ReturnType<typeof getFlight>>;

const buildFlightApprovalRequest = (
  flight: Flight,
  input: { customerName: string; customerEmail: string; adults: number }
): BookingApprovalRequest => ({
  type: 'booking_approval',
  action: 'create_flight_booking',
  title: 'Confirm flight booking',
  description: `${flight.airline.name} ${flight.flight_number} · ${flight.origin} → ${flight.destination}`,
  referenceId: flight.id,
  details: {
    passenger: input.customerName,
    email: input.customerEmail,
    departure: flight.departure_time,
    adults: input.adults,
    seatsAvailable: flight.seats_available,
  },
  totalPrice: flight.price * input.adults,
  currency: flight.currency,
  allowedDecisions: ['approve', 'reject'],
});

const flightChanged = (a: Flight, b: Flight): boolean =>
  a.price !== b.price || a.currency !== b.currency || a.departure_time !== b.departure_time;

export const bookFlightTool = tool(
  async (input) => {
    let flight: Flight;
    try {
      flight = await getFlight(input.flightId);
    } catch (error) {
      return formatToolResult(toolError(error, TOOL_ERROR_MESSAGES.FLIGHT_BOOKING));
    }

    if (!requestBookingApproval(buildFlightApprovalRequest(flight, input))) {
      return formatToolResult({ status: 'rejected', type: 'flight' });
    }

    try {
      const fresh = await getFlight(input.flightId);
      if (fresh.seats_available < input.adults) {
        throw new Error('Not enough seats are available');
      }

      if (flightChanged(fresh, flight)) {
        if (!requestBookingApproval(buildFlightApprovalRequest(fresh, input))) {
          return formatToolResult({ status: 'rejected', type: 'flight' });
        }
      }

      return formatToolResult(await submitFlightBooking(input, fresh));
    } catch (error) {
      return formatToolResult(toolError(error, TOOL_ERROR_MESSAGES.FLIGHT_BOOKING));
    }
  },
  {
    name: 'bookFlightTool',
    description: `Create a real booking in the configured travel API for the user's selected flight.
    Only call after the user selected a flight and supplied passenger name, email, and phone.
    This tool revalidates the selected flight, always pauses for explicit human approval, and
    re-verifies price/availability after approval before booking (asking again if anything changed).`,
    schema: FlightBookingInputSchema,
    responseFormat: 'content_and_artifact',
  }
);

type Hotel = Awaited<ReturnType<typeof revalidateHotel>>;

const buildHotelApprovalRequest = (
  hotel: Hotel,
  input: {
    customerName: string;
    customerEmail: string;
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
  }
): BookingApprovalRequest => ({
  type: 'booking_approval',
  action: 'create_hotel_booking',
  title: 'Confirm hotel booking',
  description: `${hotel.name} · ${input.checkIn} → ${input.checkOut}`,
  referenceId: hotel.id,
  details: {
    guest: input.customerName,
    email: input.customerEmail,
    rooms: input.rooms,
    adults: input.adults,
    children: input.children,
    nights: hotel.nights,
  },
  totalPrice: hotel.total_price,
  currency: hotel.currency,
  allowedDecisions: ['approve', 'reject'],
});

const hotelChanged = (a: Hotel, b: Hotel): boolean =>
  a.total_price !== b.total_price ||
  a.currency !== b.currency ||
  a.available_rooms !== b.available_rooms;

export const bookHotelTool = tool(
  async (input) => {
    let hotel: Hotel;
    try {
      hotel = await revalidateHotel(input);
    } catch (error) {
      return formatToolResult(toolError(error, TOOL_ERROR_MESSAGES.HOTEL_BOOKING));
    }

    if (!requestBookingApproval(buildHotelApprovalRequest(hotel, input))) {
      return formatToolResult({ status: 'rejected', type: 'hotel' });
    }

    try {
      const fresh = await revalidateHotel(input);

      if (hotelChanged(fresh, hotel)) {
        if (!requestBookingApproval(buildHotelApprovalRequest(fresh, input))) {
          return formatToolResult({ status: 'rejected', type: 'hotel' });
        }
      }

      return formatToolResult(await submitHotelBooking(input));
    } catch (error) {
      return formatToolResult(toolError(error, TOOL_ERROR_MESSAGES.HOTEL_BOOKING));
    }
  },
  {
    name: 'bookHotelTool',
    description: `Create a real booking in the configured travel API for the user's selected hotel.
    Only call after the user selected a hotel and supplied stay dates, party size, guest name, email,
    and phone. This tool revalidates availability, always pauses for explicit human approval, and
    re-verifies availability after approval before booking (asking again if anything changed).`,
    schema: HotelBookingInputSchema,
    responseFormat: 'content_and_artifact',
  }
);

export const cancelBookingTool = tool(
  async (input) => {
    let booking: Awaited<ReturnType<typeof getBooking>>;
    try {
      booking = await getBooking(input.bookingId);
    } catch (error) {
      return formatToolResult(toolError(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL));
    }

    const isApproved = requestBookingApproval({
      type: 'booking_approval',
      action: 'cancel_booking',
      title: 'Confirm booking cancellation',
      description: booking.summary,
      referenceId: booking.id,
      details: {
        confirmationCode: booking.confirmationCode,
        bookingType: booking.type,
        customer: booking.customerName,
        currentStatus: booking.status,
      },
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      allowedDecisions: ['approve', 'reject'],
    });

    if (!isApproved) return formatToolResult({ status: 'rejected', type: 'cancellation' });

    try {
      return formatToolResult(await cancelBooking(input));
    } catch (error) {
      return formatToolResult(toolError(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL));
    }
  },
  {
    name: 'cancelBookingTool',
    description: `Cancel an existing flight or hotel booking by booking ID or confirmation code.
Always pauses for explicit human approval before cancellation.`,
    schema: CancelBookingInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
