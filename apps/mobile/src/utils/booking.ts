import { z } from 'zod';

// Constants
import {
  BOOKING_ACTIONS,
  BOOKING_APPROVAL_DECISIONS,
  BOOKING_APPROVAL_REQUEST_TYPE,
  BOOKING_CREATION_DECLINED_MESSAGE,
  BOOKING_DECISIONS,
  TOOL_NAMES,
} from '@repo/constants';

// Utils
import { cancellationRejection, parseToolResult } from '@repo/utils';

// Types
import type { BookingApprovalRequest, BookingDecision } from '@repo/types';

export type EditableBookingDetails = Record<string, string | number | boolean | null>;

interface ActionRequest {
  name: string;
  args: Record<string, unknown>;
}

export type HitlResponse =
  | { decisions: [{ type: typeof BOOKING_DECISIONS.APPROVE }] }
  | {
      decisions: [
        {
          type: typeof BOOKING_DECISIONS.EDIT;
          editedAction: { name: string; args: Record<string, unknown> };
        },
      ];
    }
  | { decisions: [{ type: typeof BOOKING_DECISIONS.REJECT; message: string }] };

/**
 * Builds the exact HITL resolve() payload the agent's booking-approval interrupt expects.
 * Pure and platform-neutral — mirrors apps/web's inline useBookingAction.tsx logic.
 */
export const buildHitlResponse = (
  decision: BookingDecision,
  actionRequest: ActionRequest,
  rejectionMessage: string,
  editedDetails?: EditableBookingDetails
): HitlResponse => {
  if (decision === BOOKING_DECISIONS.APPROVE) {
    return { decisions: [{ type: BOOKING_DECISIONS.APPROVE }] };
  }

  if (decision === BOOKING_DECISIONS.EDIT && editedDetails) {
    return {
      decisions: [
        {
          type: BOOKING_DECISIONS.EDIT,
          editedAction: {
            name: actionRequest.name,
            args: { ...actionRequest.args, ...editedDetails },
          },
        },
      ],
    };
  }

  return { decisions: [{ type: BOOKING_DECISIONS.REJECT, message: rejectionMessage }] };
};

const hitlRequestSchema = z.object({
  actionRequests: z.array(
    z.object({
      name: z.string(),
      args: z.record(z.string(), z.unknown()),
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

type BookingAction = (typeof BOOKING_ACTIONS)[keyof typeof BOOKING_ACTIONS];

const APPROVAL_ACTION_BY_TOOL: Record<string, BookingAction> = {
  [TOOL_NAMES.BOOK_FLIGHT]: BOOKING_ACTIONS.CREATE_FLIGHT,
  [TOOL_NAMES.BOOK_HOTEL]: BOOKING_ACTIONS.CREATE_HOTEL,
  [TOOL_NAMES.CANCEL_BOOKING]: BOOKING_ACTIONS.CANCEL,
};

/**
 * Parses a LangGraph HITL interrupt payload into the shared booking-approval contract, or
 * `null` when it doesn't describe a supported single-action booking approval — mirrors
 * apps/web's inline `bookingApprovalRequest` in useBookingAction.tsx exactly, since both sides
 * must agree on the same `approvalId`/decision shape the agent's humanInTheLoopMiddleware expects.
 */
export const parseBookingApprovalRequest = (value: unknown): BookingApprovalRequest | null => {
  const parsed = hitlRequestSchema.safeParse(parseToolResult(value));

  if (!parsed.success || parsed.data.actionRequests.length !== 1) return null;

  const action = parsed.data.actionRequests[0];
  const args = action.args;
  const config = parsed.data.reviewConfigs.find((item) => item.actionName === action.name);
  const approvalAction = APPROVAL_ACTION_BY_TOOL[action.name];

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
      Object.entries(args).filter(([, item]) => item !== undefined && item !== null)
    ) as Record<string, string | number | boolean | null>,
    allowedDecisions: config?.allowedDecisions ?? [...BOOKING_APPROVAL_DECISIONS],
  };
};

/** Builds the interrupt resume payload for a booking-approval decision. */
export const buildBookingDecisionResume = (
  interruptValue: unknown,
  decision: BookingDecision,
  editedDetails?: EditableBookingDetails
): HitlResponse | null => {
  const request = parseBookingApprovalRequest(interruptValue);

  if (!request) return null;

  const rejectionMessage =
    request.action === BOOKING_ACTIONS.CANCEL
      ? cancellationRejection(request.referenceId)
      : BOOKING_CREATION_DECLINED_MESSAGE;
  const { actionRequests } = parseToolResult(interruptValue) as { actionRequests: ActionRequest[] };

  return buildHitlResponse(decision, actionRequests[0]!, rejectionMessage, editedDetails);
};
