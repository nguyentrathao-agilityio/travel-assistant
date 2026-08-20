import { createElement, useCallback, useEffect, useState } from 'react';
import { useCopilotKit, type ReactToolCallRenderer } from '@copilotkit/react-core/v2';

type ToolCall = {
  id: string;
  function: { name: string; arguments: string };
};

type AssistantToolCallMessage = { toolCalls?: ToolCall[] };

type ToolResultMessage = {
  role: string;
  toolCallId?: string;
  content?: unknown;
};

const parseArguments = (value: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value) as unknown;

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const resultContent = (content: unknown): string =>
  typeof content === 'string' ? content : JSON.stringify(content ?? null);

/** Re-renders persisted tool calls using the V2 renderer registry. */
export const useToolCallRenderer = () => {
  const { copilotkit } = useCopilotKit();
  const [renderers, setRenderers] = useState<ReadonlyArray<ReactToolCallRenderer>>(
    copilotkit.renderToolCalls
  );

  useEffect(() => {
    setRenderers(copilotkit.renderToolCalls);
    const subscription = copilotkit.subscribe({
      onRenderToolCallsChanged: ({ renderToolCalls }) => setRenderers(renderToolCalls),
    });

    return () => subscription.unsubscribe();
  }, [copilotkit]);

  return useCallback(
    (message: AssistantToolCallMessage, messages: ToolResultMessage[]) => {
      const toolCall = message.toolCalls?.[0];

      if (!toolCall) return null;

      const name = toolCall.function.name;
      const registration =
        renderers.find((renderer) => renderer.name === name) ??
        renderers.find((renderer) => renderer.name === '*');

      if (!registration) return null;

      const toolResult = messages.find(
        (message) => message.role === 'tool' && message.toolCallId === toolCall.id
      );
      const props = toolResult
        ? {
            name,
            toolCallId: toolCall.id,
            args: parseArguments(toolCall.function.arguments),
            status: 'complete' as const,
            result: resultContent(toolResult.content),
          }
        : {
            name,
            toolCallId: toolCall.id,
            args: parseArguments(toolCall.function.arguments),
            status: 'executing' as const,
            result: undefined,
          };

      return () => createElement(registration.render as React.ComponentType<typeof props>, props);
    },
    [renderers]
  );
};
