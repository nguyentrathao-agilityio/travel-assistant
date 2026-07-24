import { z } from 'zod';

import { parseToolResult, safeParseToolResult } from '@/utils/toolResult';

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
});
