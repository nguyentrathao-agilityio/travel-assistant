import type { RetryPolicy } from '@langchain/langgraph';

export const EXTERNAL_API_RETRY_POLICY: RetryPolicy = { maxAttempts: 3, initialInterval: 1000 };

/** Maximum supervisor-driven semantic retries for read-only domain agents. */
export const MAX_RETRIES_PER_NODE = 2;
