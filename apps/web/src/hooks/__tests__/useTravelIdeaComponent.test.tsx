import { renderHook } from '@testing-library/react';
import { useComponent } from '@copilotkit/react-core/v2';
import { useTravelIdeaComponent } from '@/hooks/useTravelIdeaComponent';

jest.mock('@copilotkit/react-core/v2', () => ({
  useComponent: jest.fn(),
}));

describe('useTravelIdeaComponent', () => {
  beforeEach(() => jest.mocked(useComponent).mockClear());

  it('registers a display-only destination idea tool', () => {
    renderHook(() => useTravelIdeaComponent());

    expect(jest.mocked(useComponent)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'showDestinationIdea',
        description: expect.stringContaining('destination idea'),
        parameters: expect.anything(),
        render: expect.any(Function),
      }),
      []
    );
  });
});
