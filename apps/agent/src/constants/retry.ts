import type { RetryPolicy } from '@langchain/langgraph';

export const EXTERNAL_API_RETRY_POLICY: RetryPolicy = { maxAttempts: 3, initialInterval: 1000 };
