import { Hono } from 'hono';

// Api
import { registerCopilotKit } from './copilotkit';
import { registerOpenAiKeyRoutes } from './openai-key';
import { registerVoiceSessionRoutes } from './voice-session';

export const app = new Hono();

registerOpenAiKeyRoutes(app);
registerVoiceSessionRoutes(app);
registerCopilotKit(app);
