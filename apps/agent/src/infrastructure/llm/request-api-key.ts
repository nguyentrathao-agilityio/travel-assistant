import type { RunnableConfig } from '@langchain/core/runnables';
import { AsyncLocalStorage } from 'node:async_hooks';

import { OPENAI_API_KEY_HEADER } from '@/constants';

const apiKeyStorage = new AsyncLocalStorage<string>();

export class OpenAiApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAiApiKeyError';
  }
}

const validatedApiKey = (value: unknown): string => {
  const apiKey = typeof value === 'string' ? value.trim() : '';

  if (!apiKey) throw new OpenAiApiKeyError('OpenAI API key is required');
  if (!apiKey.startsWith('sk-')) throw new OpenAiApiKeyError('OpenAI API key is invalid');

  return apiKey;
};

export const openAiApiKeyFromConfig = (config?: RunnableConfig): string => {
  const forwardedHeaders = config?.configurable?.copilotkit_forwarded_headers;

  if (!forwardedHeaders || typeof forwardedHeaders !== 'object') return validatedApiKey(undefined);

  const entry = Object.entries(forwardedHeaders as Record<string, unknown>).find(
    ([name]) => name.toLowerCase() === OPENAI_API_KEY_HEADER
  );

  return validatedApiKey(entry?.[1]);
};

export const withOpenAiApiKey = <T>(apiKey: string, operation: () => Promise<T>): Promise<T> =>
  apiKeyStorage.run(validatedApiKey(apiKey), operation);

export const currentOpenAiApiKey = (): string => validatedApiKey(apiKeyStorage.getStore());
