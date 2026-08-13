import { tool } from '@langchain/core/tools';

// Schemas
import { FlightBookingInputSchema } from '@/schemas';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES } from '@/constants';

// Services
import { getFlight, submitFlightBooking } from '@/services';

// Utils
import { bookingToolError, formatBookingToolResult } from '@/utils/booking-approval';
import { withToolTimeout } from '@/utils/tool-contract';

type Flight = Awaited<ReturnType<typeof getFlight>>;

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

    try {
      const fresh = await withToolTimeout(getFlight(input.flightId));
      if (fresh.seats_available < input.adults) throw new Error('Not enough seats are available');

      if (flightChanged(fresh, flight)) {
        return formatBookingToolResult({
          error: 'Flight details changed before booking. Review the latest option and try again.',
        });
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
    Human approval is enforced by agent middleware before this tool executes. This tool revalidates
    price and availability immediately before booking and stops if the selected flight changed.`,
    schema: FlightBookingInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
