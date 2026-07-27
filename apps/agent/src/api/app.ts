import { Hono } from 'hono';

import { registerCopilotKit } from './copilotkit';

// Create a Hono app and register the CopilotKit routes
export const app = new Hono();

registerCopilotKit(app);
