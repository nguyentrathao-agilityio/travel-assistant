import { describe, expect, it } from 'vitest';

import { HotelSearchResultSchema } from '@repo/schemas';

import { buildStressTranscript } from '../stress-transcript';

describe('buildStressTranscript', () => {
  it.each([1, 3, 20, 50, 100, 500])('builds exactly %i messages', (count) => {
    expect(buildStressTranscript(count)).toHaveLength(count);
  });

  it('uses unique message IDs', () => {
    const ids = buildStressTranscript(500).map((message) => message.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('places every tool result directly after its assistant tool call', () => {
    const messages = buildStressTranscript(100);

    messages.forEach((message, index) => {
      if (message.role !== 'tool') return;

      const owner = messages[index - 1];
      const callIds = (owner?.toolCalls ?? []).map((call) => (call as { id: string }).id);

      expect(owner?.role).toBe('assistant');
      expect(callIds).toContain(message.toolCallId);
    });
  });

  it('includes hotel results the mobile card can parse, with images', () => {
    const hotelResult = buildStressTranscript(100).find((message) => message.role === 'tool');
    const parsed = HotelSearchResultSchema.safeParse(JSON.parse(String(hotelResult?.content)));

    expect(parsed.success).toBe(true);
    expect(parsed.data?.results[0]?.imageUrl).toMatch(/^https:\/\//);
  });
});
