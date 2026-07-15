import 'dotenv/config';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { Observability, SensitiveDataFilter, MastraStorageExporter } from '@mastra/observability';
import { registerCopilotKit } from '@ag-ui/mastra/copilotkit';

import { travelAgent } from './agents/travel-agent';
import { tripSummaryWorkflow, destinationExplorerWorkflow } from './workflows';
import { storage, vector, VECTOR_STORE_NAME } from './stores';
import { seedRagRoute } from './routes/seed-rag';

// Constants
import {
  STATE_KEYS,
  HEADER_CLIENT_DATE,
  HEADER_CLIENT_TIMEZONE,
  CONTEXT_CLIENT_DATE,
  CONTEXT_CLIENT_TIMEZONE,
} from '@/constants';

// Utils
import { todayIso } from '@/utils';

export const mastra = new Mastra({
  agents: { travelAgent },
  workflows: { tripSummaryWorkflow, destinationExplorerWorkflow },
  storage,
  vectors: {
    [VECTOR_STORE_NAME]: vector,
  },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [new MastraStorageExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
  server: {
    cors: {
      origin: '*',
      allowMethods: ['*'],
      allowHeaders: ['*'],
    },
    middleware: [
      // Error handling — put FIRST so it wraps all middleware/handlers afterwards.
      // If anywhere after throws an error, catch it here and return clean JSON
      // instead of letting the server crash.
      async (c, next) => {
        try {
          await next();
        } catch (err) {
          console.error('Request failed:', err);

          return c.json({ error: 'Internal server error' }, 500);
        }
      },
      // Validate and load the OpenAI API key into the requestContext (only for the /chat/* route).
      //   - Check if the key exists and is in the correct format (starts with 'sk-') -> if incorrect, block with a 401.
      //   - If valid, set it in the requestContext (separately for each request, DO NOT use process.env
      // to avoid key mix-ups between concurrent requests).
      {
        path: '/chat/*',
        handler: async (c, next) => {
          const apiKey = c.req.header('x-openai-api-key');

          if (!apiKey || !apiKey.startsWith('sk-')) {
            return c.json({ error: 'Missing or invalid OpenAI API key' }, 401);
          }

          const requestContext = c.get('requestContext');
          requestContext.set('openai-api-key', apiKey);
          await next();
        },
      },
      // Request logging — Should run for ALL routes.
      // Measure the processing time for each request.
      async (c, next) => {
        const start = Date.now();
        await next();
        console.log(`${c.req.method} ${c.req.url} - ${Date.now() - start}ms`);
      },
    ],
    build: {
      apiReqLogs: {
        enabled: true,
        excludePaths: ['/health', '/ready'],
        includeQueryParams: false,
      },
    },
    apiRoutes: [
      seedRagRoute,
      registerCopilotKit({
        path: '/chat',
        resourceId: 'travelAgent',
        setContext: async (c, requestContext) => {
          requestContext.set(CONTEXT_CLIENT_DATE, c.req.header(HEADER_CLIENT_DATE) ?? todayIso());
          requestContext.set(CONTEXT_CLIENT_TIMEZONE, c.req.header(HEADER_CLIENT_TIMEZONE) ?? null);
          try {
            const payload = await c.req.raw.clone().json();
            const state = payload?.body?.state ?? {};
            STATE_KEYS.forEach((key) => requestContext.set(key, state?.[key] ?? null));
          } catch (e) {
            console.error('[setContext] error:', e);
          }
        },
      }),
    ],
  },
});
