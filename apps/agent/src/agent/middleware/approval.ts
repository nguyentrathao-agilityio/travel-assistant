import { humanInTheLoopMiddleware } from 'langchain';
import { BOOKING_APPROVAL_DECISIONS, BOOKING_DECISIONS, TOOL_NAMES } from '@repo/constants';

// Cancellation is binary (approve/reject) — only booking creation can be edited before confirming.
const allowedDecisionsFor = (toolName: string) =>
  toolName === TOOL_NAMES.CANCEL_BOOKING
    ? [...BOOKING_APPROVAL_DECISIONS]
    : [BOOKING_DECISIONS.APPROVE, BOOKING_DECISIONS.EDIT, BOOKING_DECISIONS.REJECT];

export const createApprovalMiddleware = (approvalTools?: readonly string[]) =>
  approvalTools?.length
    ? [
        humanInTheLoopMiddleware({
          interruptOn: Object.fromEntries(
            approvalTools.map((toolName) => [
              toolName,
              { allowedDecisions: allowedDecisionsFor(toolName) },
            ])
          ),
        }),
      ]
    : [];
