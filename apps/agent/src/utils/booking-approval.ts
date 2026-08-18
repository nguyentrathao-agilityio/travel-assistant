// Constants
import { contentAndArtifact, TOOL_PROVIDERS } from '@/constants';

// Utils
import { mapToolError } from './tool-contract';

export const formatBookingToolResult = (result: unknown): [string, unknown] =>
  contentAndArtifact(result);

export const bookingToolError = (error: unknown, fallbackMessage: string) => ({
  ...mapToolError(error, TOOL_PROVIDERS.TRAVEL_API, fallbackMessage),
  retryable: false,
});

/** Converts a caught booking failure into the tool's content-and-artifact response contract. */
export const formatBookingToolFailure = (
  error: unknown,
  fallbackMessage: string
): [string, unknown] => formatBookingToolResult(bookingToolError(error, fallbackMessage));
