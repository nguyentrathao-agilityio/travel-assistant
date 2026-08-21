import { tool } from '@langchain/core/tools';

// Constants
import { TOOL_NAMES } from '@repo/constants';
import { TOOL_ERROR_MESSAGES, TOOL_RESPONSE_FORMAT } from '@/constants';

// Schemas
import { HotelBookingInputSchema } from '@/schemas';

// Services
import { revalidateHotel, submitHotelBooking } from '@/services';

// Tools
import { formatBookingToolFailure, formatBookingToolResult } from './response';

// Utils
import { withToolTimeout } from '@/utils/tool';

type Hotel = Awaited<ReturnType<typeof revalidateHotel>>;

const hotelChanged = (a: Hotel, b: Hotel): boolean =>
  a.total_price !== b.total_price ||
  a.currency !== b.currency ||
  a.available_rooms !== b.available_rooms;

export const bookHotelTool = tool(
  async (input) => {
    let hotel: Hotel;

    try {
      hotel = await withToolTimeout(revalidateHotel(input));
    } catch (error) {
      return formatBookingToolFailure(error, TOOL_ERROR_MESSAGES.HOTEL_BOOKING);
    }

    try {
      const fresh = await withToolTimeout(revalidateHotel(input));

      if (hotelChanged(fresh, hotel)) {
        return formatBookingToolResult({
          error: 'Hotel details changed before booking. Review the latest option and try again.',
        });
      }

      return formatBookingToolResult(await withToolTimeout(submitHotelBooking(input)));
    } catch (error) {
      return formatBookingToolFailure(error, TOOL_ERROR_MESSAGES.HOTEL_BOOKING);
    }
  },
  {
    name: TOOL_NAMES.BOOK_HOTEL,
    description: `Create a real booking in the configured travel API for the user's selected hotel.
    Only call after the user selected a hotel and supplied stay dates, party size, guest name, email,
    and phone. Human approval is enforced by agent middleware before this tool executes. This tool
    revalidates availability immediately before booking and stops if the hotel details changed.`,
    schema: HotelBookingInputSchema,
    responseFormat: TOOL_RESPONSE_FORMAT.CONTENT_AND_ARTIFACT,
  }
);
