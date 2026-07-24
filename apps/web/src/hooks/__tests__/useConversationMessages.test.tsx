import { renderHook } from '@testing-library/react';
import { useLazyToolRenderer } from '@copilotkit/react-core';

import { useConversationMessages } from '@/hooks/useConversationMessages';

describe('useConversationMessages', () => {
  it('attaches generativeUI to a persisted assistant message with tool calls', () => {
    const rendered = <div>weather-card</div>;
    const lazyRenderer = jest.fn(() => rendered);
    jest.mocked(useLazyToolRenderer).mockReturnValue(jest.fn(() => lazyRenderer));

    const persistedMessages = [
      {
        id: 'a1',
        role: 'assistant' as const,
        toolCalls: [
          {
            id: 'call-1',
            type: 'function' as const,
            function: { name: 'weatherTool', arguments: '{}' },
          },
        ],
      },
      { id: 't1', role: 'tool' as const, toolCallId: 'call-1', content: '{"temp":72}' },
    ];

    const { result } = renderHook(() => useConversationMessages(persistedMessages, []));

    const assistantMessage = result.current.find(
      (message): message is typeof message & { role: 'assistant' } =>
        message.id === 'a1' && message.role === 'assistant'
    );
    expect(assistantMessage?.generativeUI?.()).toBe(rendered);
  });

  it('leaves a message untouched when there is no matching renderer', () => {
    jest.mocked(useLazyToolRenderer).mockReturnValue(jest.fn(() => null));

    const persistedMessages = [{ id: 'a1', role: 'assistant' as const, content: 'hello' }];

    const { result } = renderHook(() => useConversationMessages(persistedMessages, []));

    const [message] = result.current;
    expect(message.role === 'assistant' && message.generativeUI).toBeFalsy();
  });

  it('does not overwrite generativeUI already attached by CopilotKit on live messages', () => {
    const liveRenderer = jest.fn(() => <div>live</div>);
    const lazyToolRendered = jest.fn();
    jest.mocked(useLazyToolRenderer).mockReturnValue(lazyToolRendered);

    const liveMessages = [
      { id: 'a1', role: 'assistant' as const, content: 'hi', generativeUI: liveRenderer },
    ];

    const { result } = renderHook(() => useConversationMessages([], liveMessages));

    const [message] = result.current;
    expect(message.role === 'assistant' && message.generativeUI).toBe(liveRenderer);
    expect(lazyToolRendered).not.toHaveBeenCalled();
  });
});
