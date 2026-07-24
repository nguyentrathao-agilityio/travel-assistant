import { tool } from '@langchain/core/tools';
import { interrupt } from '@langchain/langgraph';
import type { BookingApprovalRequest } from '@repo/types';

import {
  cancelBooking,
  getBooking,
  getFlight,
  bookFlight,
  bookHotel,
  revalidateHotel,
} from '../services';
import {
  BookingApprovalResponseSchema,
  CancelBookingInputSchema,
  FlightBookingInputSchema,
  HotelBookingInputSchema,
} from '../schemas';
import { TOOL_ERROR_MESSAGES } from '../constants';

const serializeToolResult = (result: unknown): string => JSON.stringify(result);

const requestBookingApproval = (request: BookingApprovalRequest): boolean => {
  const response = interrupt(request);
  const parsedResponse =
    typeof response === 'string'
      ? (() => {
          try {
            return JSON.parse(response) as unknown;
          } catch {
            return { decision: response };
          }
        })()
      : response;

  return BookingApprovalResponseSchema.parse(parsedResponse).decision === 'approve';
};

const serializeToolError = (error: unknown, fallbackMessage: string): string =>
  serializeToolResult({ error: error instanceof Error ? error.message : fallbackMessage });

export const bookFlightTool = tool(
  async (input) => {
    let flight: Awaited<ReturnType<typeof getFlight>>;
    try {
      flight = await getFlight(input.flightId);
    } catch (error) {
      return serializeToolError(error, TOOL_ERROR_MESSAGES.FLIGHT_BOOKING);
    }

    const isApproved = requestBookingApproval({
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

    if (!isApproved) return serializeToolResult({ status: 'rejected', type: 'flight' });

    try {
      return serializeToolResult(await bookFlight(input));
    } catch (error) {
      return serializeToolError(error, TOOL_ERROR_MESSAGES.FLIGHT_BOOKING);
    }
  },
  {
    name: 'bookFlightTool',
    description: `Create a real booking in the configured travel API for the user's selected flight.
    Only call after the user selected a flight and supplied passenger name, email, and phone.
    This tool revalidates the selected flight and always pauses for explicit human approval.`,
    schema: FlightBookingInputSchema,
    returnDirect: true,
  }
);

export const bookHotelTool = tool(
  async (input) => {
    let hotel: Awaited<ReturnType<typeof revalidateHotel>>;
    try {
      hotel = await revalidateHotel(input);
    } catch (error) {
      return serializeToolError(error, TOOL_ERROR_MESSAGES.HOTEL_BOOKING);
    }

    const isApproved = requestBookingApproval({
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

    if (!isApproved) return serializeToolResult({ status: 'rejected', type: 'hotel' });

    try {
      return serializeToolResult(await bookHotel(input));
    } catch (error) {
      return serializeToolError(error, TOOL_ERROR_MESSAGES.HOTEL_BOOKING);
    }
  },
  {
    name: 'bookHotelTool',
    description: `Create a real booking in the configured travel API for the user's selected hotel.
Only call after the user selected a hotel and supplied stay dates, party size, guest name, email,
and phone. This tool revalidates availability and always pauses for explicit human approval.`,
    schema: HotelBookingInputSchema,
    returnDirect: true,
  }
);

export const cancelBookingTool = tool(
  async (input) => {
    let booking: Awaited<ReturnType<typeof getBooking>>;
    try {
      booking = await getBooking(input.bookingId);
    } catch (error) {
      return serializeToolError(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL);
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

    if (!isApproved) return serializeToolResult({ status: 'rejected', type: 'cancellation' });

    try {
      return serializeToolResult(await cancelBooking(input));
    } catch (error) {
      return serializeToolError(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL);
    }
  },
  {
    name: 'cancelBookingTool',
    description: `Cancel an existing flight or hotel booking by booking ID or confirmation code.
Always pauses for explicit human approval before cancellation.`,
    schema: CancelBookingInputSchema,
    returnDirect: true,
  }
);
