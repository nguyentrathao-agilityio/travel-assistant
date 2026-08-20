import { render, renderHook } from '@testing-library/react';
import { useCopilotKit } from '@copilotkit/react-core/v2';

import { useToolCallRenderer } from '@/hooks/useToolCallRenderer';

describe('useToolCallRenderer', () => {
  it('renders a registered V2 tool renderer with the persisted result', () => {
    const ToolCard = ({ status, result }: { status: string; result?: string }) => (
      <div>{`${status}:${result}`}</div>
    );
    const copilotkit = {
      renderToolCalls: [{ name: 'weatherTool', render: ToolCard }],
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    };

    jest.mocked(useCopilotKit).mockReturnValue({ copilotkit } as never);

    const { result } = renderHook(() => useToolCallRenderer());
    const renderer = result.current(
      {
        toolCalls: [
          {
            id: 'call-1',
            function: { name: 'weatherTool', arguments: '{"city":"Da Nang"}' },
          },
        ],
      },
      [{ role: 'tool', toolCallId: 'call-1', content: '{"temp":30}' }]
    );
    const view = render(renderer!());

    expect(view.getByText('complete:{"temp":30}')).toBeInTheDocument();
  });
});
