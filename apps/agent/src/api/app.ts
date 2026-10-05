import { Hono } from 'hono';

// Api
import { registerCopilotKit } from './copilotkit';
import { registerOpenAiKeyRoutes } from './openai-key';
import { registerVoiceAudioRoutes } from './voice-audio';
import { registerVoiceSessionRoutes } from './voice-session';
import { registerVoiceTurnRoutes } from './voice-turn';
import { registerTranscriptRoutes } from './transcript';

export const app = new Hono();

registerOpenAiKeyRoutes(app);
registerVoiceSessionRoutes(app);
registerVoiceTurnRoutes(app);
registerVoiceAudioRoutes(app);
registerTranscriptRoutes(app);
registerCopilotKit(app);
