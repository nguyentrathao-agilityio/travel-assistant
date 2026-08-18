import { Hono } from 'hono';

// API
import { registerCopilotKit } from './copilotkit';
import { registerOpenAiKeyRoutes } from './openai-key';

export const app = new Hono();

registerOpenAiKeyRoutes(app);
registerCopilotKit(app);
