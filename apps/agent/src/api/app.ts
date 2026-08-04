import { Hono } from 'hono';

import { registerCopilotKit } from './copilotkit';

export const app = new Hono();

registerCopilotKit(app);
