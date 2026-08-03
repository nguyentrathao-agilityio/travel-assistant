import { OpenAI } from 'openai';

export { OPENAI_CLIENT_MODEL } from '../../constants';

export const getOpenAIClient = (): OpenAI => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
