import { afterEach, describe, expect, it, vi } from 'vitest';

const getDestinationExplorerMock = vi.fn();

vi.mock('../../services/destination-explorer', () => ({
  getDestinationExplorer: (...args: unknown[]) => getDestinationExplorerMock(...args),
}));

import { destinationExplorerTool } from '../destination-explorer';

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

const input = { city: 'Da Nang', country: 'Vietnam', forecastDays: 5 };

afterEach(() => {
  vi.clearAllMocks();
});

describe('destinationExplorerTool', () => {
  it('returns the destination explorer result as the tool artifact on success', async () => {
    const destinationExplorerResult = {
      city: 'Da Nang',
      places: { results: [] },
      tips: { country: 'Vietnam', tips: [] },
      weather: null,
    };
    getDestinationExplorerMock.mockResolvedValueOnce(destinationExplorerResult);

    const result = artifactOf(
      await destinationExplorerTool.invoke(toolCall(destinationExplorerTool.name, input))
    );

    expect(getDestinationExplorerMock).toHaveBeenCalledWith(input);
    expect(result).toEqual(destinationExplorerResult);
  });

  it('returns an error artifact when getDestinationExplorer throws an Error', async () => {
    getDestinationExplorerMock.mockRejectedValueOnce(new Error('provider unavailable'));

    const result = artifactOf(
      await destinationExplorerTool.invoke(toolCall(destinationExplorerTool.name, input))
    );

    expect(result).toEqual({ error: 'provider unavailable' });
  });

  it('falls back to the generic destination explorer error message for a non-Error throw', async () => {
    getDestinationExplorerMock.mockRejectedValueOnce('boom');

    const result = artifactOf(
      await destinationExplorerTool.invoke(toolCall(destinationExplorerTool.name, input))
    );

    expect(result).toEqual({
      error: 'Destination explorer failed. Try searching places, tips, or weather separately.',
    });
  });
});
