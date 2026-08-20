import { useInterrupt, useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Components
import {
  BookingApprovalCard,
  BookingResultCard,
  renderToolResult,
  ToolLoading,
} from '@/components';

// Constants
import { BOOKING_CREATION_DECLINED_MESSAGE, TOOL_NAMES, TOOL_STATUS } from '@/constants';

// Types
import type { BookingApprovalRequest, BookingDecision } from '@repo/types';

// Utils
import {
  cancellationRejection,
  isIntentionalRejectionResult,
  isToolPending,
  parseToolResult,
} from '@/utils';
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
  const parsed = hitlRequestSchema.safeParse(parseToolResult(value));

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

const useBookingResultRenderer = (toolName: string, isAwaitingApproval: boolean) => {
  useRenderTool(
    {
      name: toolName,
      parameters: z.record(z.unknown()),
      render: ({ status, result }) => {
        const pending = isToolPending(status);

        if (pending && isAwaitingApproval) return <></>;
        if (!pending && status !== TOOL_STATUS.COMPLETE) return <></>;

        const parsedResult = parseToolResult(result);

        if (isIntentionalRejectionResult(parsedResult)) return <></>;

        return renderToolResult({
          status,
          result,
          schema: bookingResultSchema,
          loading: <ToolLoading action="Completing" target="your booking" />,
          invalidMessage: 'Received an unexpected booking result.',
          render: (booking) => <BookingResultCard booking={booking} />,
        });
      },
    },
    [isAwaitingApproval]
  );
};

export const useBookingAction = () => {
  // Register the human approval gate shared by booking and cancellation tools.
  const interrupt = useInterruptElement();

  useInterrupt({
    enabled: ({ value }) => bookingApprovalRequest(value) !== null,
    render: ({ event, resolve }) => {
      const approvalRequest = bookingApprovalRequest(event.value);

      if (!approvalRequest) return <></>;

      const handleDecision = (decision: BookingDecision) => {
        const rejectionMessage =
          approvalRequest.action === 'cancel_booking'
            ? cancellationRejection(approvalRequest.referenceId)
            : BOOKING_CREATION_DECLINED_MESSAGE;
        const hitlResponse = {
          decisions: [
            decision === 'approve'
              ? { type: 'approve' }
              : { type: 'reject', message: rejectionMessage },
          ],
        };

        (resolve as (value: typeof hitlResponse) => void)(hitlResponse);
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
