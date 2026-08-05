import { createHash } from 'node:crypto';
import { interrupt } from '@langchain/langgraph';
import type { BookingApprovalRequest, BookingApprovalResponse } from '@repo/types';

// Schemas
import { BookingApprovalResponseSchema } from '@/schemas/booking';

// Constants
import { contentAndArtifact } from '@/constants';

// Utils
import { mapToolError } from './tool-contract';

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
  request: Omit<BookingApprovalRequest, 'approvalId' | 'draftId'>
): BookingApprovalRequest => {
  const approvalId = createHash('sha256').update(JSON.stringify(request)).digest('hex');
  return { ...request, approvalId, draftId: approvalId };
};

export const requestBookingApproval = (
  request: BookingApprovalRequest
): BookingApprovalResponse => {
  let parsed = BookingApprovalResponseSchema.parse(parseApprovalResponse(interrupt(request)));

  if (parsed.decision !== 'approve') return parsed;

  while (parsed.approvalId !== request.approvalId) {
    parsed = BookingApprovalResponseSchema.parse(parseApprovalResponse(interrupt(request)));
    if (parsed.decision !== 'approve') return parsed;
  }

  return parsed;
};

export const bookingToolError = (error: unknown, fallbackMessage: string) => ({
  ...mapToolError(error, 'travel-api', fallbackMessage),
  retryable: false,
});
