import {
  useCopilotChatInternal,
  useLangGraphInterrupt,
  useRenderToolCall,
} from '@copilotkit/react-core';
import { z } from 'zod';

// Components
import {
  BookingApprovalCard,
  BookingDecisionCard,
  BookingResultCard,
  ErrorCard,
  ToolLoading,
} from '@/components';

// Constants
import { TOOL_NAMES, TOOL_STATUS } from '@/constants';

// Types
import type { BookingApprovalRequest, BookingDecision } from '@repo/types';

const bookingResultSchema = z.object({
  id: z.string(),
  confirmationCode: z.string(),
  type: z.enum(['flight', 'hotel']),
  referenceId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  totalPrice: z.number(),
  currency: z.string(),
  status: z.enum(['confirmed', 'cancelled']),
  createdAt: z.string(),
  notes: z.string().optional(),
  summary: z.string(),
});

const bookingApprovalRequestSchema = z.object({
  type: z.literal('booking_approval'),
  action: z.enum(['create_flight_booking', 'create_hotel_booking', 'cancel_booking']),
  title: z.string(),
  description: z.string(),
  referenceId: z.string(),
  details: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  totalPrice: z.number().optional(),
  currency: z.string().optional(),
  allowedDecisions: z.array(z.enum(['approve', 'reject'])),
});

const rejectedBookingActionSchema = z.object({
  status: z.literal('rejected'),
  type: z.enum(['flight', 'hotel', 'cancellation']),
});

type ToolParameterDefinition = {
  name: string;
  type: 'string' | 'number';
  description: string;
  required: boolean;
};

const bookingToolParameters: Record<string, ToolParameterDefinition[]> = {
  [TOOL_NAMES.BOOK_FLIGHT]: [
    { name: 'flightId', type: 'string', description: 'Selected flight ID', required: true },
    { name: 'adults', type: 'number', description: 'Adult passengers', required: true },
    { name: 'customerName', type: 'string', description: 'Passenger name', required: true },
    { name: 'customerEmail', type: 'string', description: 'Passenger email', required: true },
    { name: 'customerPhone', type: 'string', description: 'Passenger phone', required: true },
    { name: 'notes', type: 'string', description: 'Optional notes', required: false },
  ],
  [TOOL_NAMES.BOOK_HOTEL]: [
    { name: 'hotelId', type: 'string', description: 'Selected hotel ID', required: true },
    { name: 'city', type: 'string', description: 'Hotel city', required: true },
    { name: 'checkIn', type: 'string', description: 'Check-in date', required: true },
    { name: 'checkOut', type: 'string', description: 'Check-out date', required: true },
    { name: 'rooms', type: 'number', description: 'Rooms', required: true },
    { name: 'adults', type: 'number', description: 'Adults', required: true },
    { name: 'children', type: 'number', description: 'Children', required: true },
    { name: 'customerName', type: 'string', description: 'Guest name', required: true },
    { name: 'customerEmail', type: 'string', description: 'Guest email', required: true },
    { name: 'customerPhone', type: 'string', description: 'Guest phone', required: true },
    { name: 'notes', type: 'string', description: 'Optional notes', required: false },
  ],
  [TOOL_NAMES.CANCEL_BOOKING]: [
    { name: 'bookingId', type: 'string', description: 'Booking ID', required: true },
  ],
};

const parseToolResult = (result: unknown): unknown => {
  if (typeof result !== 'string') return result;
  try {
    return JSON.parse(result) as unknown;
  } catch {
    return result;
  }
};

const useBookingResultRenderer = (toolName: string, isAwaitingApproval: boolean) => {
  useRenderToolCall({
    name: toolName,
    description: 'Render a booking or cancellation result.',
    parameters: bookingToolParameters[toolName],
    render: ({ status, result }) => {
      if (status === 'inProgress' || status === 'executing') {
        if (isAwaitingApproval) return <></>;
        return <ToolLoading action="Completing" target="your booking" />;
      }

      if (status !== TOOL_STATUS.COMPLETE) return <></>;

      const parsedResult = parseToolResult(result);
      const bookingResult = bookingResultSchema.safeParse(parsedResult);
      if (bookingResult.success) {
        return <BookingResultCard booking={bookingResult.data} />;
      }

      const rejectedAction = rejectedBookingActionSchema.safeParse(parsedResult);
      if (rejectedAction.success) {
        return <BookingDecisionCard action={rejectedAction.data.type} />;
      }

      const errorResult = z.object({ error: z.string() }).safeParse(parsedResult);
      if (errorResult.success) return <ErrorCard message={errorResult.data.error} />;

      return <></>;
    },
  });
};

export const useBookingAction = () => {
  const { interrupt } = useCopilotChatInternal();

  useLangGraphInterrupt<BookingApprovalRequest>({
    enabled: ({ eventValue }) => bookingApprovalRequestSchema.safeParse(eventValue).success,
    render: ({ event, resolve }) => {
      const approvalRequest = bookingApprovalRequestSchema.safeParse(event.value);
      if (!approvalRequest.success) return <></>;

      const handleDecision = (decision: BookingDecision) => {
        resolve(JSON.stringify({ decision }));
      };

      return <BookingApprovalCard request={approvalRequest.data} onDecision={handleDecision} />;
    },
  });

  const isAwaitingApproval = interrupt !== null;
  useBookingResultRenderer(TOOL_NAMES.BOOK_FLIGHT, isAwaitingApproval);
  useBookingResultRenderer(TOOL_NAMES.BOOK_HOTEL, isAwaitingApproval);
  useBookingResultRenderer(TOOL_NAMES.CANCEL_BOOKING, isAwaitingApproval);
};
