import { OpenAI } from 'openai';

export { OPENAI_CLIENT_MODEL } from '../../constants';

/** Raw OpenAI SDK client, used for `responses.create` calls that need structured JSON output. */
export const getOpenAIClient = (): OpenAI => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
