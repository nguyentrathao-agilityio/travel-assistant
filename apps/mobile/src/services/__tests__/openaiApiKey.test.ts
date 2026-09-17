import { isApiKeyError } from '../openaiApiKey';

test.each([
  ['a 401 status code in the message', 'Request failed with status 401'],
  ['"incorrect API key" case-insensitively', 'Incorrect API key provided'],
  ['"invalid API key"', 'Error: invalid api key'],
  ['the missing-key message the agent returns', 'OpenAI API key is required'],
])('recognizes %s', (_label, message) => {
  expect(isApiKeyError(message)).toBe(true);
});

test.each([['Network request failed'], ['Rate limited, please retry']])(
  'does not flag unrelated errors: %s',
  (message) => {
    expect(isApiKeyError(message)).toBe(false);
  }
);
