import { serve } from '@hono/node-server';
import {
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotHonoHandler,
} from '@copilotkit/runtime/v2';
import { LangGraphAgent } from '@copilotkit/runtime/langgraph';

import { LANGGRAPH_DEPLOYMENT_URL, COPILOTKIT_PORT } from './constants';

const travelAgent = new LangGraphAgent({
  deploymentUrl: LANGGRAPH_DEPLOYMENT_URL,
  graphId: 'travel',
});

const runtime = new CopilotRuntime({
  agents: { travelAgent },
  runner: new InMemoryAgentRunner(),
});

const app = createCopilotHonoHandler({
  runtime,
  basePath: '/chat',
  cors: { origin: '*', credentials: false },
});

serve({ fetch: app.fetch, port: COPILOTKIT_PORT }, (info) => {
  console.log(`CopilotKit runtime listening on http://localhost:${info.port}/chat`);
});
