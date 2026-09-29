import { END } from '@langchain/langgraph';
import { describe, expect, it } from 'vitest';

import { buildGraph } from '@/agent';

describe('outer agent graph topology', () => {
  it('persists transcripts after both normal finalization and refusal', () => {
    const edges = [...buildGraph().edges];

    expect(edges).toEqual(
      expect.arrayContaining([
        ['saveMemory', 'persistTranscript'],
        ['refusal', 'persistTranscript'],
        ['persistTranscript', END],
      ])
    );
    expect(edges).not.toContainEqual(['saveMemory', END]);
    expect(edges).not.toContainEqual(['refusal', END]);
  });
});
