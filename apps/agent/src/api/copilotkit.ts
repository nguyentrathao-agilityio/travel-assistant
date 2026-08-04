import type { Hono } from 'hono';
import {
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotHonoHandler,
} from '@copilotkit/runtime/v2';
import { LangGraphAgent } from '@copilotkit/runtime/langgraph';
import type { Assistant } from '@langchain/langgraph-sdk';

import { LANGGRAPH_DEPLOYMENT_URL } from '../constants';
import { createCopilotKitHooks } from './hooks';

// Overrides the base lookup to resolve the assistant by matching `graph_id` directly, since the
// base implementation doesn't reliably resolve this deployment's assistant by graph id alone.
// Falls back to the base behavior if no match is found.
class BridgedLangGraphAgent extends LangGraphAgent {
  override async getAssistant(): Promise<Assistant> {
    const assistants = await this.client.assistants.search({
      graphId: this.graphId,
      limit: 100,
    });

    const assistant = assistants.find((candidate) => candidate.graph_id === this.graphId);
    if (assistant) return assistant;

    return super.getAssistant();
  }
}

/** Mounts the CopilotKit `/chat` runtime, bridged to the `travel` LangGraph deployment, on `app`. */
export function registerCopilotKit(app: Hono): void {
  const travelAgent = new BridgedLangGraphAgent({
    deploymentUrl: LANGGRAPH_DEPLOYMENT_URL,
    graphId: 'travel',
  });

  const agents = { travelAgent };

  const runtime = new CopilotRuntime({
    agents,
    runner: new InMemoryAgentRunner(),
  });

  const copilotApp = createCopilotHonoHandler({
    runtime,
    basePath: '/chat',
    mode: 'single-route',
    cors: { origin: '*', credentials: false },
    hooks: createCopilotKitHooks(Object.keys(agents)),
  });

  app.route('/', copilotApp);
}
