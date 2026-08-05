import { Hono } from 'hono';

// API
import { registerCopilotKit } from './copilotkit';

export const app = new Hono();

registerCopilotKit(app);
