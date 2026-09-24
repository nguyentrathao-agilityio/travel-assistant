import { modelRetryMiddleware } from 'langchain';

// Constants
import { MODEL_RETRY_MAX_RETRIES } from '@/constants';

// Re-raises after the last retry so modelFallbackMiddleware still gets the error.
export const createModelRetryMiddleware = () =>
  modelRetryMiddleware({ maxRetries: MODEL_RETRY_MAX_RETRIES, onFailure: 'error' });
