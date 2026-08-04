import { createHash } from 'node:crypto';
import { interrupt } from '@langchain/langgraph';
import type { BookingApprovalRequest } from '@repo/types';

import { BookingApprovalResponseSchema } from '../../schemas';
import { contentAndArtifact } from '../../constants';

export const formatBookingToolResult = (result: unknown): [string, unknown] =>
  contentAndArtifact(result);

const parseApprovalResponse = (response: unknown): unknown => {
  if (typeof response !== 'string') return response;

  try {
    return JSON.parse(response) as unknown;
  } catch {
    return { decision: response };
  }
};

export const withApprovalId = (
  request: Omit<BookingApprovalRequest, 'approvalId'>
): BookingApprovalRequest => ({
  ...request,
  approvalId: createHash('sha256').update(JSON.stringify(request)).digest('hex'),
});

export const requestBookingApproval = (request: BookingApprovalRequest): boolean => {
  let parsed = BookingApprovalResponseSchema.parse(parseApprovalResponse(interrupt(request)));

  if (parsed.decision !== 'approve') return false;

  while (parsed.approvalId !== request.approvalId) {
    parsed = BookingApprovalResponseSchema.parse(parseApprovalResponse(interrupt(request)));
    if (parsed.decision !== 'approve') return false;
  }

  return true;
};

export const bookingToolError = (error: unknown, fallbackMessage: string): { error: string } => ({
  error: error instanceof Error ? error.message : fallbackMessage,
});
