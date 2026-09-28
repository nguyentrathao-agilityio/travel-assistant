import { describe, expect, it } from 'vitest';
import { TranscriptPageSchema } from '@repo/schemas';

describe('TranscriptPageSchema', () => {
  it('accepts an ordered page with an opaque previous cursor', () => {
    expect(
      TranscriptPageSchema.parse({
        messages: [{ id: 'm1', role: 'user', content: 'Hello' }],
        previousCursor: 'eyJzZXF1ZW5jZSI6MX0',
        hasPreviousPage: true,
      })
    ).toMatchObject({ hasPreviousPage: true });
  });

  it('rejects unsupported roles and mismatched cursor state', () => {
    expect(() =>
      TranscriptPageSchema.parse({
        messages: [{ id: 'm1', role: 'system', content: 'secret' }],
        previousCursor: null,
        hasPreviousPage: true,
      })
    ).toThrow();
  });
});
