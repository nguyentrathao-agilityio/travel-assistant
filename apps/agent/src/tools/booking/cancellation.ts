import { tool } from '@langchain/core/tools';

// Schemas
import { CancelBookingInputSchema } from '@/schemas';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES, TOOL_RESPONSE_FORMAT } from '@/constants';

// Services
import { cancelBooking, getBooking } from '@/services';

// Utils
import { formatBookingToolFailure, formatBookingToolResult } from '@/utils/booking-approval';
import { withToolTimeout } from '@/utils/tool-contract';

export const cancelBookingTool = tool(
  async (input) => {
    try {
      await withToolTimeout(getBooking(input.bookingId));
    } catch (error) {
      return formatBookingToolFailure(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL);
    }

    try {
      return formatBookingToolResult(await withToolTimeout(cancelBooking(input)));
    } catch (error) {
      return formatBookingToolFailure(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL);
    }
  },
  {
    name: TOOL_NAMES.CANCEL_BOOKING,
    description: `Cancel an existing flight or hotel booking by booking ID or confirmation code.
    Human approval is enforced by agent middleware before this tool executes.`,
    schema: CancelBookingInputSchema,
    responseFormat: TOOL_RESPONSE_FORMAT.CONTENT_AND_ARTIFACT,
  }
);
