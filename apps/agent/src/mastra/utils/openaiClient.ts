import { OpenAI } from 'openai';

export const getOpenAIClient = (): OpenAI => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const OPENAI_CLIENT_MODEL = 'gpt-4o-mini';
