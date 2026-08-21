import { humanInTheLoopMiddleware } from 'langchain';

export const createApprovalMiddleware = (approvalTools?: readonly string[]) =>
  approvalTools?.length
    ? [
        humanInTheLoopMiddleware({
          interruptOn: Object.fromEntries(
            approvalTools.map((toolName) => [
              toolName,
              { allowedDecisions: ['approve', 'reject'] as const },
            ])
          ),
        }),
      ]
    : [];
