import { humanInTheLoopMiddleware } from 'langchain';
import { BOOKING_APPROVAL_DECISIONS } from '@repo/constants';

export const createApprovalMiddleware = (approvalTools?: readonly string[]) =>
  approvalTools?.length
    ? [
        humanInTheLoopMiddleware({
          interruptOn: Object.fromEntries(
            approvalTools.map((toolName) => [
              toolName,
              { allowedDecisions: [...BOOKING_APPROVAL_DECISIONS] },
            ])
          ),
        }),
      ]
    : [];
