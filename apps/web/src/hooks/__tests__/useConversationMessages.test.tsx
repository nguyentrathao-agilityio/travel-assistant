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

    const { result } = renderHook(() => useConversationMessages(persistedMessages, []));

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

    const { result } = renderHook(() => useConversationMessages([], liveMessages));

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
