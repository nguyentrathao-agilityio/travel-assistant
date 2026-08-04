import { tool } from '@langchain/core/tools';
import type { BookingApprovalRequest } from '@repo/types';

import { TOOL_ERROR_MESSAGES } from '../../constants';
import { HotelBookingInputSchema } from '../../schemas';
import { revalidateHotel, submitHotelBooking } from '../../services';
import {
  bookingToolError,
  formatBookingToolResult,
  requestBookingApproval,
  withApprovalId,
} from '../../utils/booking-approval';

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
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.HOTEL_BOOKING));
    }

    if (!requestBookingApproval(buildHotelApprovalRequest(hotel, input))) {
      return formatBookingToolResult({ status: 'rejected', type: 'hotel' });
    }

    try {
      const fresh = await revalidateHotel(input);
      if (
        hotelChanged(fresh, hotel) &&
        !requestBookingApproval(buildHotelApprovalRequest(fresh, input))
      ) {
        return formatBookingToolResult({ status: 'rejected', type: 'hotel' });
      }

      return formatBookingToolResult(await submitHotelBooking(input));
    } catch (error) {
      return formatBookingToolResult(bookingToolError(error, TOOL_ERROR_MESSAGES.HOTEL_BOOKING));
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
