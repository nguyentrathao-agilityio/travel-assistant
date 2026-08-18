import { OpenAI } from 'openai';
import { currentOpenAiApiKey } from './request-api-key';

export { OPENAI_CLIENT_MODEL } from '@/constants';

/** OpenAI client for structured response calls in the current graph request. */
export const getOpenAIClient = (): OpenAI => new OpenAI({ apiKey: currentOpenAiApiKey() });
