import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Utils
import { parseToolInput } from '@/utils/schema';

describe('parseToolInput', () => {
  const schema = z.object({ count: z.number().int().positive() });

  it('returns validated tool input', async () => {
    await expect(parseToolInput(schema, { count: 2 })).resolves.toEqual({ count: 2 });
  });

  it('rejects invalid input with the shared validation message', async () => {
    await expect(parseToolInput(schema, { count: 0 })).rejects.toThrow(
      'Validation error: Number must be greater than 0'
    );
  });
});
