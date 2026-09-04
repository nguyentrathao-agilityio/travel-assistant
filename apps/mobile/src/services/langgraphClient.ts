import { Client } from '@langchain/langgraph-sdk';

import { resolveRuntimeUrl } from '../config';

let cachedClient: Client | null = null;

export const getLanggraphClient = (): Client => {
  if (!cachedClient) {
    const runtimeUrl = resolveRuntimeUrl(process.env.EXPO_PUBLIC_RUNTIME_URL);
    cachedClient = new Client({ apiUrl: runtimeUrl.replace(/\/chat\/?$/, ''), apiKey: null });
  }

  return cachedClient;
};
