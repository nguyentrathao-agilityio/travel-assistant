import { tool } from '@langchain/core/tools';

// Schemas
import { CancelBookingInputSchema } from '@/schemas';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES } from '@/constants';

// Services
import { cancelBooking, getBooking } from '@/services';

// Utils
import { bookingToolError, formatBookingToolResult } from '@/utils/booking-approval';
import { withToolTimeout } from '@/utils/tool-contract';

export const cancelBookingTool = tool(
  async (input) => {
    try {
      await withToolTimeout(getBooking(input.bookingId));
    } catch (error) {
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL));
    }

    try {
      return formatBookingToolResult(await withToolTimeout(cancelBooking(input)));
    } catch (error) {
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL));
    }
  },
  {
    name: TOOL_NAMES.CANCEL_BOOKING,
    description: `Cancel an existing flight or hotel booking by booking ID or confirmation code.
    Human approval is enforced by agent middleware before this tool executes.`,
    schema: CancelBookingInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
