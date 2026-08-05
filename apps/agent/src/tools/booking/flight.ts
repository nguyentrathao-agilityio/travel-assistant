import { tool } from '@langchain/core/tools';
import type { BookingApprovalRequest } from '@repo/types';

// Schemas
import { FlightBookingInputSchema } from '@/schemas';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES } from '@/constants';

// Services
import { getFlight, submitFlightBooking } from '@/services';

// Utils
import {
  bookingToolError,
  formatBookingToolResult,
  requestBookingApproval,
  withApprovalId,
} from '@/utils/booking-approval';
import { withToolTimeout } from '@/utils/tool-contract';

type Flight = Awaited<ReturnType<typeof getFlight>>;

const buildFlightApprovalRequest = (
  flight: Flight,
  input: { customerName: string; customerEmail: string; adults: number }
): BookingApprovalRequest =>
  withApprovalId({
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
    allowedDecisions: ['approve', 'edit', 'reject'],
  });

const flightChanged = (a: Flight, b: Flight): boolean =>
  a.price !== b.price || a.currency !== b.currency || a.departure_time !== b.departure_time;

export const bookFlightTool = tool(
  async (input) => {
    let flight: Flight;
    try {
      flight = await withToolTimeout(getFlight(input.flightId));
    } catch (error) {
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.FLIGHT_BOOKING));
    }

    const approval = requestBookingApproval(buildFlightApprovalRequest(flight, input));
    if (approval.decision !== 'approve') {
      return formatBookingToolResult({
        status: approval.decision === 'edit' ? 'edit_requested' : 'rejected',
        type: 'flight',
        ...(approval.edits && { edits: approval.edits }),
      });
    }

    try {
      const fresh = await withToolTimeout(getFlight(input.flightId));
      if (fresh.seats_available < input.adults) throw new Error('Not enough seats are available');

      if (
        flightChanged(fresh, flight) &&
        requestBookingApproval(buildFlightApprovalRequest(fresh, input)).decision !== 'approve'
      ) {
        return formatBookingToolResult({ status: 'rejected', type: 'flight' });
      }

      return formatBookingToolResult(await withToolTimeout(submitFlightBooking(input, fresh)));
    } catch (error) {
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.FLIGHT_BOOKING));
    }
  },
  {
    name: TOOL_NAMES.BOOK_FLIGHT,
    description: `Create a real booking in the configured travel API for the user's selected flight.
    Only call after the user selected a flight and supplied passenger name, email, and phone.
    This tool revalidates the selected flight, always pauses for explicit human approval, and
    re-verifies price/availability after approval before booking (asking again if anything changed).`,
    schema: FlightBookingInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
