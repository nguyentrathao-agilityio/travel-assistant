import { Client } from '@langchain/langgraph-sdk';

import { resolveRuntimeUrl } from '../config';

let cachedClient: Client | null = null;

const REQUEST_TIMEOUT_MS = 15000;

export const getLanggraphClient = (): Client => {
  if (!cachedClient) {
    const runtimeUrl = resolveRuntimeUrl(process.env.EXPO_PUBLIC_RUNTIME_URL);
    cachedClient = new Client({
      apiUrl: runtimeUrl.replace(/\/chat\/?$/, ''),
      apiKey: null,
      timeoutMs: REQUEST_TIMEOUT_MS,
    });
  }

  return cachedClient;
};
