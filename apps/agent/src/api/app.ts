import { Hono } from 'hono';

// Api
import { registerCopilotKit } from './copilotkit';
import { registerOpenAiKeyRoutes } from './openai-key';
import { registerVoiceSessionRoutes } from './voice-session';
import { registerVoiceTurnRoutes } from './voice-turn';
import { registerTranscriptRoutes } from './transcript';

export const app = new Hono();

registerOpenAiKeyRoutes(app);
registerVoiceSessionRoutes(app);
registerVoiceTurnRoutes(app);
registerTranscriptRoutes(app);
registerCopilotKit(app);
