// Constants
import { contentAndArtifact } from '@/constants';

// Utils
import { mapToolError } from './tool-contract';

export const formatBookingToolResult = (result: unknown): [string, unknown] =>
  contentAndArtifact(result);

export const bookingToolError = (error: unknown, fallbackMessage: string) => ({
  ...mapToolError(error, 'travel-api', fallbackMessage),
  retryable: false,
});
