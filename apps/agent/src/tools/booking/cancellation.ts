import { tool } from '@langchain/core/tools';

// Schemas
import { CancelBookingInputSchema } from '@/schemas';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES } from '@/constants';

// Services
import { cancelBooking, getBooking } from '@/services';

// Utils
import {
  bookingToolError,
  formatBookingToolResult,
  requestBookingApproval,
  withApprovalId,
} from '@/utils/booking-approval';
import { withToolTimeout } from '@/utils/tool-contract';

export const cancelBookingTool = tool(
  async (input) => {
    let booking: Awaited<ReturnType<typeof getBooking>>;
    try {
      booking = await withToolTimeout(getBooking(input.bookingId));
    } catch (error) {
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL));
    }

    const approval = requestBookingApproval(
      withApprovalId({
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
      })
    );

    if (approval.decision !== 'approve') {
      return formatBookingToolResult({ status: 'rejected', type: 'cancellation' });
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
Always pauses for explicit human approval before cancellation.`,
    schema: CancelBookingInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
