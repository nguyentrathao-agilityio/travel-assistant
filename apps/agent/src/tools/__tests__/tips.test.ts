import { afterEach, describe, expect, it, vi } from 'vitest';

const getLocalTipsMock = vi.fn();

vi.mock('@/services/tips', () => ({
  getLocalTips: (...args: unknown[]) => getLocalTipsMock(...args),
}));

import { tipsTool } from '@/tools/tips';

const toolCall = (name: string, args: object) => ({
  name,
  args,
  id: `call-${name}`,
  type: 'tool_call' as const,
});

const artifactOf = <T>(result: unknown): T => {
  if (typeof result === 'object' && result !== null && 'artifact' in result) {
    return result.artifact as T;
  }

  throw new Error('Expected a ToolMessage with an artifact');
};

const input = {
  country: 'Vietnam',
  city: 'Da Nang',
  category: 'food' as const,
  essential_only: false,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('tipsTool', () => {
  it('returns the tips result as the tool artifact on success', async () => {
    const tipsResult = {
      country: 'Vietnam',
      tips: [{ category: 'food', text: 'Try bun cha.' }],
    };
    getLocalTipsMock.mockResolvedValueOnce(tipsResult);

    const result = artifactOf(await tipsTool.invoke(toolCall(tipsTool.name, input)));

    expect(getLocalTipsMock).toHaveBeenCalledWith(input);
    expect(result).toEqual(tipsResult);
  });

  it('returns an error artifact when getLocalTips throws an Error', async () => {
    getLocalTipsMock.mockRejectedValueOnce(new Error('provider unavailable'));

    const result = artifactOf(await tipsTool.invoke(toolCall(tipsTool.name, input)));

    expect(result).toEqual(expect.objectContaining({ error: 'provider unavailable' }));
  });

  it('falls back to the generic local tips error message for a non-Error throw', async () => {
    getLocalTipsMock.mockRejectedValueOnce('boom');

    const result = artifactOf(await tipsTool.invoke(toolCall(tipsTool.name, input)));

    expect(result).toEqual(
      expect.objectContaining({
        error: 'Local tips are unavailable right now. Please try again.',
      })
    );
  });
});
