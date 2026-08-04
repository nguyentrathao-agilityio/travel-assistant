import { tool } from '@langchain/core/tools';

import { TOOL_ERROR_MESSAGES } from '../../constants';
import { CancelBookingInputSchema } from '../../schemas';
import { cancelBooking, getBooking } from '../../services';
import {
  bookingToolError,
  formatBookingToolResult,
  requestBookingApproval,
  withApprovalId,
} from './shared';

export const cancelBookingTool = tool(
  async (input) => {
    let booking: Awaited<ReturnType<typeof getBooking>>;
    try {
      booking = await getBooking(input.bookingId);
    } catch (error) {
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL));
    }

    const isApproved = requestBookingApproval(
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

    if (!isApproved) {
      return formatBookingToolResult({ status: 'rejected', type: 'cancellation' });
    }

    try {
      return formatBookingToolResult(await cancelBooking(input));
    } catch (error) {
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.BOOKING_CANCEL));
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
