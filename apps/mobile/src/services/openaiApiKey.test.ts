import assert from 'node:assert/strict';
import test from 'node:test';

import { isApiKeyError } from './openaiApiKey';

test('recognizes a 401 status code in the message', () => {
  assert.equal(isApiKeyError('Request failed with status 401'), true);
});

test('recognizes "incorrect API key" case-insensitively', () => {
  assert.equal(isApiKeyError('Incorrect API key provided'), true);
});

test('recognizes "invalid API key"', () => {
  assert.equal(isApiKeyError('Error: invalid api key'), true);
});

test('recognizes the missing-key message the agent returns', () => {
  assert.equal(isApiKeyError('OpenAI API key is required'), true);
});

test('does not flag unrelated errors', () => {
  assert.equal(isApiKeyError('Network request failed'), false);
  assert.equal(isApiKeyError('Rate limited, please retry'), false);
});
