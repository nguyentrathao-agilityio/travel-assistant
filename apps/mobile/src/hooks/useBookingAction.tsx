import { ToolCallStatus, useInterrupt } from '@copilotkit/react-native/headless';
import { z } from 'zod';

// Constants
import {
  AGENT_NAME,
  BOOKING_ACTIONS,
  BOOKING_CREATION_DECLINED_MESSAGE,
  BOOKING_STATUSES,
  BOOKING_TYPES,
  TOOL_NAMES,
} from '@repo/constants';

// Components
import { BookingApprovalCard } from '../components/BookingApprovalCard';
import { BookingResultCard } from '../components/BookingResultCard';
import { renderToolResult } from '../components/common/renderToolResult';

// Hooks
import { useInterruptElement } from './useInterruptElement';
import { useRenderToolResult } from './useRenderToolResult';

// Utils
import {
  buildHitlResponse,
  cancellationRejection,
  isBookingBlockedResult,
  isIntentionalRejectionResult,
  parseBookingApprovalRequest,
} from '../utils/booking';
import { isToolPending, parseToolResult } from '../utils/toolResult';

// Types
import type { BookingDecision } from '@repo/types';

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

const useBookingResultRenderer = (toolName: string, isAwaitingApproval: boolean) => {
  useRenderToolResult(
    {
      name: toolName,
      schema: z.record(z.string(), z.unknown()),
      render: ({ status, result }) => {
        const pending = isToolPending(status);

        if (pending && isAwaitingApproval) return <></>;
        if (!pending && status !== ToolCallStatus.Complete) return <></>;

        const parsedResult = parseToolResult(result);

        if (isIntentionalRejectionResult(parsedResult) || isBookingBlockedResult(parsedResult)) {
          return <></>;
        }

        return renderToolResult({
          status,
          result,
          schema: bookingResultSchema,
          invalidMessage: 'Received an unexpected booking result.',
          render: (booking) => <BookingResultCard booking={booking} />,
        });
      },
    },
    [isAwaitingApproval]
  );
};

export const useBookingAction = () => {
  useInterrupt({
    agentId: AGENT_NAME,
    enabled: ({ value }) => parseBookingApprovalRequest(value) !== null,
    render: ({ event, resolve }) => {
      const approvalRequest = parseBookingApprovalRequest(event.value);

      if (!approvalRequest) return <></>;

      const handleDecision = (
        decision: BookingDecision,
        editedDetails?: Record<string, string | number | boolean | null>
      ) => {
        const rejectionMessage =
          approvalRequest.action === BOOKING_ACTIONS.CANCEL
            ? cancellationRejection(approvalRequest.referenceId)
            : BOOKING_CREATION_DECLINED_MESSAGE;
        const parsedValue = parseToolResult(event.value) as {
          actionRequests: Array<{ name: string; args: Record<string, unknown> }>;
        };
        const hitlResponse = buildHitlResponse(
          decision,
          parsedValue.actionRequests[0],
          rejectionMessage,
          editedDetails
        );

        void resolve(hitlResponse);
      };

      return <BookingApprovalCard onDecision={handleDecision} request={approvalRequest} />;
    },
  });

  // Register result renderers with awareness of the active approval state.
  const interrupt = useInterruptElement();
  const isAwaitingApproval = interrupt !== null;

  useBookingResultRenderer(TOOL_NAMES.BOOK_FLIGHT, isAwaitingApproval);
  useBookingResultRenderer(TOOL_NAMES.BOOK_HOTEL, isAwaitingApproval);
  useBookingResultRenderer(TOOL_NAMES.CANCEL_BOOKING, isAwaitingApproval);
};
