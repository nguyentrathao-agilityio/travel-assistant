import { OpenAI } from 'openai';

export { OPENAI_CLIENT_MODEL } from '../../constants';

/** OpenAI client for structured response calls. */
export const getOpenAIClient = (): OpenAI => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
