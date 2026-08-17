import React from 'react';
import { render } from '@testing-library/react';
import { useRenderTool } from '@copilotkit/react-core/v2';

// Hooks
import { useDefaultToolRenderer } from '@/hooks/useDefaultToolRenderer';

jest.mock('@/components', () => ({
  ToolLoading: ({ target }: { target: string }) => <div>Loading {target}</div>,
  ToolErrorCard: () => <div>Tool failed</div>,
  ToolCompletedCard: ({ message }: { message: string }) => <div>{message}</div>,
}));

const Harness = () => {
  useDefaultToolRenderer();

  return null;
};

beforeEach(() => jest.mocked(useRenderTool).mockClear());

describe('useDefaultToolRenderer', () => {
  it('registers one wildcard renderer', () => {
    render(<Harness />);

    expect(useRenderTool).toHaveBeenCalledTimes(1);
    expect(jest.mocked(useRenderTool).mock.calls[0][0]).toMatchObject({ name: '*' });
  });

  it('renders a generic loading state for an unhandled tool', () => {
    render(<Harness />);
    const renderer = jest.mocked(useRenderTool).mock.calls[0][0].render;
    const result = renderer({
      name: 'unknown_tool',
      toolCallId: 'call-1',
      parameters: {},
      status: 'executing',
      result: undefined,
    });
    const { getByText } = render(result);

    expect(getByText('Loading unknown tool')).toBeInTheDocument();
  });

  it('renders a completion state for an unhandled tool', () => {
    render(<Harness />);
    const renderer = jest.mocked(useRenderTool).mock.calls[0][0].render;
    const result = renderer({
      name: 'unknown_tool',
      toolCallId: 'call-1',
      parameters: {},
      status: 'complete',
      result: '{}',
    });
    const { getByText } = render(result);

    expect(getByText('Unknown tool completed.')).toBeInTheDocument();
  });
});
