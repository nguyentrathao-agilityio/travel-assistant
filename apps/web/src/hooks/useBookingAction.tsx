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
import { TOOL_NAMES, TOOL_STATUS } from '@/constants';
import {
  BOOKING_ACTIONS,
  BOOKING_APPROVAL_DECISIONS,
  BOOKING_APPROVAL_REQUEST_TYPE,
  BOOKING_CREATION_DECLINED_MESSAGE,
  BOOKING_DECISIONS,
  BOOKING_STATUSES,
  BOOKING_TYPES,
} from '@repo/constants';

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
  type: z.enum([BOOKING_TYPES.FLIGHT, BOOKING_TYPES.HOTEL]),
  referenceId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  totalPrice: z.number(),
  currency: z.string(),
  status: z.enum([BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.CANCELLED]),
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
      allowedDecisions: z.array(
        z.enum([BOOKING_DECISIONS.APPROVE, BOOKING_DECISIONS.EDIT, BOOKING_DECISIONS.REJECT])
      ),
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
    [TOOL_NAMES.BOOK_FLIGHT]: BOOKING_ACTIONS.CREATE_FLIGHT,
    [TOOL_NAMES.BOOK_HOTEL]: BOOKING_ACTIONS.CREATE_HOTEL,
    [TOOL_NAMES.CANCEL_BOOKING]: BOOKING_ACTIONS.CANCEL,
  } as const;
  const approvalAction = actionByTool[action.name as keyof typeof actionByTool];

  if (!approvalAction) return null;

  // Normalize the tool-specific identifier into the shared approval contract.
  const referenceId = String(args.flightId ?? args.hotelId ?? args.bookingId ?? '');

  return {
    type: BOOKING_APPROVAL_REQUEST_TYPE,
    approvalId: `${action.name}:${referenceId}`,
    draftId: `${action.name}:${referenceId}`,
    action: approvalAction,
    title:
      approvalAction === BOOKING_ACTIONS.CREATE_FLIGHT
        ? 'Confirm flight booking'
        : approvalAction === BOOKING_ACTIONS.CREATE_HOTEL
          ? 'Confirm hotel booking'
          : 'Confirm booking cancellation',
    description: action.description,
    referenceId,
    details: Object.fromEntries(
      Object.entries(args).filter(
        ([key, item]) => key !== 'customerPhone' && item !== undefined && item !== null
      )
    ) as Record<string, string | number | boolean | null>,
    allowedDecisions: config?.allowedDecisions ?? [...BOOKING_APPROVAL_DECISIONS],
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
          approvalRequest.action === BOOKING_ACTIONS.CANCEL
            ? cancellationRejection(approvalRequest.referenceId)
            : BOOKING_CREATION_DECLINED_MESSAGE;
        const hitlResponse = {
          decisions: [
            decision === BOOKING_DECISIONS.APPROVE
              ? { type: BOOKING_DECISIONS.APPROVE }
              : { type: BOOKING_DECISIONS.REJECT, message: rejectionMessage },
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
