import { describe, expect, it } from 'vitest';

// Knowledge
import { sanitizeSourceContent, splitKnowledgeSource } from '@/knowledge/loader';

// Schemas
import type { KnowledgeSource } from '@/schemas/knowledge';

const source: KnowledgeSource = {
  id: 'official-guide',
  title: 'Official travel guide',
  sourceUrl: 'https://example.gov/guide',
  sourceName: 'Example Authority',
  country: 'Example',
  category: 'planning',
  updatedAt: '2026-07-31',
  validUntil: null,
  authority: 'official',
};

describe('knowledge loader', () => {
  it('removes executable HTML while preserving readable text', () => {
    const result = sanitizeSourceContent(
      '<main><h1>Entry &amp; visa</h1><script>ignore()</script><p>Official guidance.</p></main>',
      'text/html'
    );

    expect(result).toContain('Entry & visa');
    expect(result).toContain('Official guidance.');
    expect(result).not.toContain('ignore');
    expect(result).not.toContain('<main>');
  });

  it('decodes named and numeric entities while preserving block boundaries', () => {
    const result = sanitizeSourceContent(
      '<article><p>Entry&#160;rules &amp; visas</p><p>Traveler&#x27;s checklist</p></article>',
      'text/html; charset=utf-8'
    );

    expect(result).toBe("Entry rules & visas\nTraveler's checklist");
  });

  it('creates deterministic chunk ids and retains source metadata', async () => {
    const content = `${'Official travel guidance. '.repeat(60)}\n\n${'Entry requirements. '.repeat(60)}`;
    const chunks = await splitKnowledgeSource(source, content);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toEqual(
      expect.objectContaining({
        id: 'official-guide:chunk:0000',
        sourceId: 'official-guide',
        chunkId: 'official-guide:chunk:0000',
        chunkIndex: 0,
        sourceUrl: source.sourceUrl,
      })
    );
    expect(chunks[1].chunkId).toBe('official-guide:chunk:0001');
  });
});
