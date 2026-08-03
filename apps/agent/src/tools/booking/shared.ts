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

export const requestBookingApproval = (request: BookingApprovalRequest): boolean => {
  const response = interrupt(request);
  return (
    BookingApprovalResponseSchema.parse(parseApprovalResponse(response)).decision === 'approve'
  );
};

export const bookingToolError = (error: unknown, fallbackMessage: string): { error: string } => ({
  error: error instanceof Error ? error.message : fallbackMessage,
});
