import { z } from 'zod';

import { getToolErrorMessage, parseToolResult, safeParseToolResult } from '@/utils/toolResult';

describe('tool result utilities', () => {
  it('parses serialized JSON results', () => {
    expect(parseToolResult('{"total":1}')).toEqual({ total: 1 });
  });

  it('preserves objects and non-JSON strings', () => {
    const result = { total: 1 };

    expect(parseToolResult(result)).toBe(result);
    expect(parseToolResult('Unavailable')).toBe('Unavailable');
  });

  it('parses and validates a result at the renderer boundary', () => {
    const schema = z.object({ total: z.number() });

    expect(safeParseToolResult(schema, '{"total":1}')).toEqual({
      success: true,
      data: { total: 1 },
    });
  });

  it.each([
    ['TIMEOUT', 'The provider took too long to respond.'],
    ['RATE_LIMITED', 'The provider is temporarily rate limited.'],
    ['AUTHENTICATION_FAILED', 'The provider is not configured correctly.'],
    ['INVALID_PROVIDER_RESPONSE', 'The provider returned an unexpected response.'],
    ['PROVIDER_UNAVAILABLE', 'The provider is temporarily unavailable.'],
    ['UNKNOWN_PROVIDER_ERROR', 'The provider operation could not be completed.'],
  ])('returns a safe public message for %s', (code, expectedMessage) => {
    expect(getToolErrorMessage({ code, error: 'Private provider details' })).toBe(expectedMessage);
  });

  it('falls back to the original error for an unmapped code', () => {
    expect(getToolErrorMessage({ code: 'CUSTOM_ERROR', error: 'Custom failure' })).toBe(
      'Custom failure'
    );
  });
});
