import { describe, expect, it } from 'vitest';

import { currentOpenAiApiKey, openAiApiKeyFromConfig, withOpenAiApiKey } from '../request-api-key';

describe('request OpenAI API key', () => {
  it('reads the key from CopilotKit forwarded headers case-insensitively', () => {
    expect(
      openAiApiKeyFromConfig({
        configurable: {
          copilotkit_forwarded_headers: { 'X-OpenAI-API-Key': '  sk-request  ' },
        },
      })
    ).toBe('sk-request');
  });

  it.each([undefined, {}, { configurable: {} }])(
    'rejects a missing forwarded key without exposing credentials',
    (config) => {
      expect(() => openAiApiKeyFromConfig(config)).toThrow('OpenAI API key is required');
    }
  );

  it('rejects a malformed key without echoing it', () => {
    const malformed = 'secret-value';

    expect(() =>
      openAiApiKeyFromConfig({
        configurable: {
          copilotkit_forwarded_headers: { 'x-openai-api-key': malformed },
        },
      })
    ).toThrow('OpenAI API key is invalid');

    try {
      openAiApiKeyFromConfig({
        configurable: {
          copilotkit_forwarded_headers: { 'x-openai-api-key': malformed },
        },
      });
    } catch (error) {
      expect(String(error)).not.toContain(malformed);
    }
  });

  it('isolates concurrent request keys', async () => {
    const values = await Promise.all([
      withOpenAiApiKey('sk-one', async () => {
        await Promise.resolve();
        return currentOpenAiApiKey();
      }),
      withOpenAiApiKey('sk-two', async () => {
        await Promise.resolve();
        return currentOpenAiApiKey();
      }),
    ]);

    expect(values).toEqual(['sk-one', 'sk-two']);
  });

  it('rejects access outside a request scope', () => {
    expect(() => currentOpenAiApiKey()).toThrow('OpenAI API key is required');
  });
});
