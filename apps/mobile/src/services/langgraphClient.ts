import { Client } from '@langchain/langgraph-sdk';

// Constants
import { DEFAULT_REQUEST_TIMEOUT_MS } from '../constants';

// Utils
import { resolveRuntimeUrl } from '../config';

let cachedClient: Client | null = null;

export const getLanggraphClient = (): Client => {
  if (!cachedClient) {
    const runtimeUrl = resolveRuntimeUrl(process.env.EXPO_PUBLIC_RUNTIME_URL);
    cachedClient = new Client({
      apiUrl: runtimeUrl.replace(/\/chat\/?$/, ''),
      apiKey: null,
      timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    });
  }

  return cachedClient;
};
