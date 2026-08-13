import { render, renderHook } from '@testing-library/react';
import { useLazyToolRenderer } from '@copilotkit/react-core';

import { useConversationMessages } from '@/hooks/useConversationMessages';

describe('useConversationMessages', () => {
  it('attaches generativeUI to a persisted assistant message with tool calls', () => {
    const rendered = <div key="call-1">weather-card</div>;
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

    const { result } = renderHook(() => useConversationMessages(persistedMessages));

    const assistantMessage = result.current.find(
      (message): message is typeof message & { role: 'assistant' } =>
        message.id === 'a1' && message.role === 'assistant'
    );
    const genUi = assistantMessage?.generativeUI?.();
    const { container } = render(genUi as React.ReactElement);
    expect(container.firstElementChild?.className).toContain('flex-col');
    expect(container.textContent).toBe('weather-card');
  });

  it('leaves a message untouched when there is no matching renderer', () => {
    jest.mocked(useLazyToolRenderer).mockReturnValue(jest.fn(() => null));

    const persistedMessages = [{ id: 'a1', role: 'assistant' as const, content: 'hello' }];

    const { result } = renderHook(() => useConversationMessages(persistedMessages));

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

    const { result } = renderHook(() => useConversationMessages(liveMessages));

    const [message] = result.current;
    expect(message.role === 'assistant' && message.generativeUI).toBe(liveRenderer);
    expect(lazyToolRendered).not.toHaveBeenCalled();
  });

  it('preserves streamed assistant text when a later snapshot replaces it with an empty tool-call message', () => {
    jest.mocked(useLazyToolRenderer).mockReturnValue(jest.fn(() => null));

    const streamedMessages = [
      { id: 'a1', role: 'assistant' as const, content: 'I found a flight for you.' },
    ];
    const toolCallMessages = [
      {
        id: 'a1',
        role: 'assistant' as const,
        content: '',
        toolCalls: [
          {
            id: 'call-1',
            type: 'function' as const,
            function: { name: 'flightsTool', arguments: '{}' },
          },
        ],
      },
    ];

    const { result, rerender } = renderHook(
      ({ messages }) => useConversationMessages(messages, 'thread-1'),
      { initialProps: { messages: streamedMessages } }
    );

    expect(result.current[0]).toMatchObject({ content: 'I found a flight for you.' });

    rerender({ messages: toolCallMessages });

    expect(result.current[0]).toMatchObject({
      id: 'a1',
      content: 'I found a flight for you.',
      toolCalls: [{ id: 'call-1' }],
    });
  });

  it('does not reuse cached assistant text after switching conversations', () => {
    jest.mocked(useLazyToolRenderer).mockReturnValue(jest.fn(() => null));
    const streamedMessages = [
      { id: 'a1', role: 'assistant' as const, content: 'Text from the previous thread.' },
    ];
    const emptyToolCallMessages = [
      {
        id: 'a1',
        role: 'assistant' as const,
        content: '',
        toolCalls: [
          {
            id: 'call-2',
            type: 'function' as const,
            function: { name: 'weatherTool', arguments: '{}' },
          },
        ],
      },
    ];

    const { result, rerender } = renderHook(
      ({ messages, threadId }) => useConversationMessages(messages, threadId),
      { initialProps: { messages: streamedMessages, threadId: 'thread-1' } }
    );

    expect(result.current[0]).toMatchObject({ content: 'Text from the previous thread.' });

    rerender({ messages: emptyToolCallMessages, threadId: 'thread-2' });

    expect(result.current[0]).toMatchObject({ content: '' });
  });

  it('keeps a visible current-turn assistant message when an in-progress tool snapshot omits it', () => {
    jest.mocked(useLazyToolRenderer).mockReturnValue(jest.fn(() => null));
    const streamedMessages = [
      { id: 'u1', role: 'user' as const, content: 'Find a flight' },
      { id: 'a-text', role: 'assistant' as const, content: 'I found an option for you.' },
    ];
    const toolSnapshot = [
      { id: 'u1', role: 'user' as const, content: 'Find a flight' },
      {
        id: 'a-tool',
        role: 'assistant' as const,
        content: '',
        toolCalls: [
          {
            id: 'call-1',
            type: 'function' as const,
            function: { name: 'flightsTool', arguments: '{}' },
          },
        ],
      },
    ];

    const { result, rerender } = renderHook(
      ({ messages, inProgress }) => useConversationMessages(messages, 'thread-1', inProgress),
      { initialProps: { messages: streamedMessages, inProgress: true } }
    );

    rerender({ messages: toolSnapshot, inProgress: true });

    expect(result.current.map(({ id }) => id)).toEqual(['u1', 'a-text', 'a-tool']);
    expect(result.current[1]).toMatchObject({ content: 'I found an option for you.' });
  });

  it('returns to the completed snapshot once the run finishes', () => {
    jest.mocked(useLazyToolRenderer).mockReturnValue(jest.fn(() => null));
    const streamedMessages = [
      { id: 'u1', role: 'user' as const, content: 'Find a flight' },
      { id: 'a-text', role: 'assistant' as const, content: 'I found an option for you.' },
    ];
    const finalMessages = [
      { id: 'u1', role: 'user' as const, content: 'Find a flight' },
      { id: 'a-final', role: 'assistant' as const, content: 'Here are the final details.' },
    ];

    const { result, rerender } = renderHook(
      ({ messages, inProgress }) => useConversationMessages(messages, 'thread-1', inProgress),
      { initialProps: { messages: streamedMessages, inProgress: true } }
    );

    rerender({ messages: finalMessages, inProgress: false });

    expect(result.current.map(({ id }) => id)).toEqual(['u1', 'a-final']);
  });

  it('renders every tool call in a multi-tool message, overriding CopilotKit single-tool-call generativeUI', () => {
    // CopilotKit's own useLazyToolRenderer only ever resolves toolCalls[0]; this
    // simulates that upstream behavior by rendering per single-toolCall message.
    const lazyToolRendered = jest.fn((message: { toolCalls?: { id: string }[] }) => {
      const toolCall = message.toolCalls?.[0];
      if (!toolCall) return null;
      return () => <div key={toolCall.id}>{toolCall.id}-card</div>;
    });
    jest
      .mocked(useLazyToolRenderer)
      .mockReturnValue(lazyToolRendered as unknown as ReturnType<typeof useLazyToolRenderer>);

    const flightCall = {
      id: 'call-flights',
      type: 'function' as const,
      function: { name: 'flightsTool', arguments: '{}' },
    };
    const hotelCall = {
      id: 'call-hotel',
      type: 'function' as const,
      function: { name: 'hotelTool', arguments: '{}' },
    };
    const routeCall = {
      id: 'call-route',
      type: 'function' as const,
      function: { name: 'routeTool', arguments: '{}' },
    };

    const liveMessages = [
      {
        id: 'a1',
        role: 'assistant' as const,
        content: '',
        // CopilotKit already pre-attached a generativeUI covering only toolCalls[0].
        generativeUI: () => <div>call-flights-card</div>,
        toolCalls: [flightCall, hotelCall, routeCall],
      },
    ];

    const { result } = renderHook(() => useConversationMessages(liveMessages));

    const [message] = result.current;
    const rendered = message.role === 'assistant' ? message.generativeUI?.() : undefined;
    const { container } = render(rendered as React.ReactElement);

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('flex-col');
    expect(wrapper?.className).toContain('gap-3');
    expect(wrapper?.children).toHaveLength(3);
    expect(wrapper?.textContent).toBe('call-flights-cardcall-hotel-cardcall-route-card');
    expect(lazyToolRendered).toHaveBeenCalledTimes(3);
    expect(lazyToolRendered).toHaveBeenCalledWith(
      expect.objectContaining({ toolCalls: [flightCall] }),
      liveMessages
    );
    expect(lazyToolRendered).toHaveBeenCalledWith(
      expect.objectContaining({ toolCalls: [hotelCall] }),
      liveMessages
    );
    expect(lazyToolRendered).toHaveBeenCalledWith(
      expect.objectContaining({ toolCalls: [routeCall] }),
      liveMessages
    );
  });
});
