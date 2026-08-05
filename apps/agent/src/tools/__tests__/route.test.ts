import { afterEach, describe, expect, it, vi } from 'vitest';

const getRouteMock = vi.fn();

vi.mock('../../services/route', () => ({
  getRoute: (...args: unknown[]) => getRouteMock(...args),
}));

import { routeTool } from '../route';

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

const input = { city: 'Hanoi', maxStops: 4 };

afterEach(() => {
  vi.clearAllMocks();
});

describe('routeTool', () => {
  it('returns the route result as the tool artifact on success', async () => {
    const routeResult = {
      city: 'Hanoi',
      stops: [{ name: 'Hoan Kiem Lake', city: 'Hanoi' }],
    };
    getRouteMock.mockResolvedValueOnce(routeResult);

    const result = artifactOf(await routeTool.invoke(toolCall(routeTool.name, input)));

    expect(getRouteMock).toHaveBeenCalledWith(input);
    expect(result).toEqual(routeResult);
  });

  it('returns an error artifact when getRoute throws an Error', async () => {
    getRouteMock.mockRejectedValueOnce(new Error('no landmarks found'));

    const result = artifactOf(await routeTool.invoke(toolCall(routeTool.name, input)));

    expect(result).toEqual(expect.objectContaining({ error: 'no landmarks found' }));
  });

  it('falls back to the generic route error message for a non-Error throw', async () => {
    getRouteMock.mockRejectedValueOnce('boom');

    const result = artifactOf(await routeTool.invoke(toolCall(routeTool.name, input)));

    expect(result).toEqual(
      expect.objectContaining({
        error: "Couldn't build a route for that city. Please try again.",
      })
    );
  });
});
