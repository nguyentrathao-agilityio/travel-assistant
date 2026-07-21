import { Client } from '@langchain/langgraph-sdk';

import { RUNTIME_URL } from '@/constants';

export const langgraphClient = new Client({
  apiUrl: RUNTIME_URL.replace(/\/chat\/?$/, ''),
  apiKey: null,
});
