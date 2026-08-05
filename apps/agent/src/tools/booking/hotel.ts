import { tool } from '@langchain/core/tools';
import type { BookingApprovalRequest } from '@repo/types';

import { TOOL_ERROR_MESSAGES, TOOL_NAMES } from '../../constants';
import { HotelBookingInputSchema } from '../../schemas';
import { revalidateHotel, submitHotelBooking } from '../../services';
import {
  bookingToolError,
  formatBookingToolResult,
  requestBookingApproval,
  withApprovalId,
} from '../../utils/booking-approval';
import { withToolTimeout } from '../../utils/tool-contract';

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
): BookingApprovalRequest =>
  withApprovalId({
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
    allowedDecisions: ['approve', 'edit', 'reject'],
  });

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
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.HOTEL_BOOKING));
    }

    const approval = requestBookingApproval(buildHotelApprovalRequest(hotel, input));
    if (approval.decision !== 'approve') {
      return formatBookingToolResult({
        status: approval.decision === 'edit' ? 'edit_requested' : 'rejected',
        type: 'hotel',
        ...(approval.edits && { edits: approval.edits }),
      });
    }

    try {
      const fresh = await withToolTimeout(revalidateHotel(input));
      if (
        hotelChanged(fresh, hotel) &&
        requestBookingApproval(buildHotelApprovalRequest(fresh, input)).decision !== 'approve'
      ) {
        return formatBookingToolResult({ status: 'rejected', type: 'hotel' });
      }

      return formatBookingToolResult(await withToolTimeout(submitHotelBooking(input)));
    } catch (error) {
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.HOTEL_BOOKING));
    }
  },
  {
    name: TOOL_NAMES.BOOK_HOTEL,
    description: `Create a real booking in the configured travel API for the user's selected hotel.
    Only call after the user selected a hotel and supplied stay dates, party size, guest name, email,
    and phone. This tool revalidates availability, always pauses for explicit human approval, and
    re-verifies availability after approval before booking (asking again if anything changed).`,
    schema: HotelBookingInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
