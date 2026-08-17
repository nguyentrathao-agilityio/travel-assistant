import { useLangGraphInterrupt, useRenderToolCall } from '@copilotkit/react-core';
import { z } from 'zod';

// Components
import { BookingApprovalCard, BookingResultCard, ErrorCard, ToolLoading } from '@/components';

// Constants
import { TOOL_NAMES, TOOL_STATUS } from '@/constants';

// Types
import type { BookingApprovalRequest, BookingDecision } from '@repo/types';

// Utils
import { parseToolResult } from '@/utils';
import { useInterruptElement } from './useInterruptElement';

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

const hitlRequestSchema = z.object({
  actionRequests: z.array(
    z.object({
      name: z.string(),
      args: z.record(z.unknown()),
      description: z.string(),
    })
  ),
  reviewConfigs: z.array(
    z.object({
      actionName: z.string(),
      allowedDecisions: z.array(z.enum(['approve', 'edit', 'reject'])),
    })
  ),
});

const bookingApprovalRequest = (value: unknown): BookingApprovalRequest | null => {
  // Accept only a single well-formed interrupt that maps to a supported booking action.
  const parsed = hitlRequestSchema.safeParse(value);

  if (!parsed.success || parsed.data.actionRequests.length !== 1) return null;

  const action = parsed.data.actionRequests[0];
  const args = action.args;
  const config = parsed.data.reviewConfigs.find((item) => item.actionName === action.name);
  const actionByTool = {
    [TOOL_NAMES.BOOK_FLIGHT]: 'create_flight_booking',
    [TOOL_NAMES.BOOK_HOTEL]: 'create_hotel_booking',
    [TOOL_NAMES.CANCEL_BOOKING]: 'cancel_booking',
  } as const;
  const approvalAction = actionByTool[action.name as keyof typeof actionByTool];

  if (!approvalAction) return null;

  // Normalize the tool-specific identifier into the shared approval contract.
  const referenceId = String(args.flightId ?? args.hotelId ?? args.bookingId ?? '');

  return {
    type: 'booking_approval',
    approvalId: `${action.name}:${referenceId}`,
    draftId: `${action.name}:${referenceId}`,
    action: approvalAction,
    title:
      approvalAction === 'create_flight_booking'
        ? 'Confirm flight booking'
        : approvalAction === 'create_hotel_booking'
          ? 'Confirm hotel booking'
          : 'Confirm booking cancellation',
    description: action.description,
    referenceId,
    details: Object.fromEntries(
      Object.entries(args).filter(
        ([key, item]) => key !== 'customerPhone' && item !== undefined && item !== null
      )
    ) as Record<string, string | number | boolean | null>,
    allowedDecisions: config?.allowedDecisions ?? ['approve', 'reject'],
  };
};

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

const useBookingResultRenderer = (toolName: string, isAwaitingApproval: boolean) => {
  useRenderToolCall({
    name: toolName,
    description: 'Render a booking or cancellation result.',
    parameters: bookingToolParameters[toolName],
    render: ({ status, result }) => {
      // Keep approval UI authoritative while a booking tool is paused.
      if (status === 'inProgress' || status === 'executing') {
        if (isAwaitingApproval) return <></>;

        return <ToolLoading action="Completing" target="your booking" />;
      }

      if (status !== TOOL_STATUS.COMPLETE) return <></>;

      // Render validated successes and surface structured provider failures safely.
      const parsedResult = parseToolResult(result);
      const bookingResult = bookingResultSchema.safeParse(parsedResult);

      if (bookingResult.success) {
        return <BookingResultCard booking={bookingResult.data} />;
      }

      const errorResult = z.object({ error: z.string() }).safeParse(parsedResult);

      if (errorResult.success) return <ErrorCard message={errorResult.data.error} />;

      return <ErrorCard message="Received an unexpected booking result." />;
    },
  });
};

export const useBookingAction = () => {
  // Register the human approval gate shared by booking and cancellation tools.
  const interrupt = useInterruptElement();

  useLangGraphInterrupt({
    enabled: ({ eventValue }) => bookingApprovalRequest(eventValue) !== null,
    render: ({ event, resolve }) => {
      const approvalRequest = bookingApprovalRequest(event.value);

      if (!approvalRequest) return <></>;

      const handleDecision = (decision: BookingDecision) => {
        const hitlResponse = {
          decisions: [
            decision === 'approve'
              ? { type: 'approve' }
              : { type: 'reject', message: 'User cancelled or requested changes.' },
          ],
        };

        (resolve as unknown as (value: typeof hitlResponse) => void)(hitlResponse);
      };

      return <BookingApprovalCard request={approvalRequest} onDecision={handleDecision} />;
    },
  });

  // Register result renderers with awareness of the active approval state.
  const isAwaitingApproval = interrupt !== null;

  useBookingResultRenderer(TOOL_NAMES.BOOK_FLIGHT, isAwaitingApproval);
  useBookingResultRenderer(TOOL_NAMES.BOOK_HOTEL, isAwaitingApproval);
  useBookingResultRenderer(TOOL_NAMES.CANCEL_BOOKING, isAwaitingApproval);
};
