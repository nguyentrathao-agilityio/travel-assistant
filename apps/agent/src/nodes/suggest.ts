import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';

// Constants
import {
  COPILOTKIT_SUGGEST_TOOL_NAME,
  INFRASTRUCTURE_NODE_NAME,
  MAX_SUGGEST_CONTEXT_MESSAGES,
  SUGGEST_NODE_NAME,
  SUGGEST_SYSTEM_PROMPT,
} from '@/constants';

// Infrastructure
import { createChatModel, openAiApiKeyFromConfig } from '@/infrastructure/llm';
import { withLangfuseTracing } from '@/infrastructure/observability';

// State
import type { GraphStateType, GraphStateUpdate } from '@/state';

interface FrontendToolDefinition {
  name?: string;
  description?: string;
  parameters?: Record<string, unknown>;
  function?: FrontendToolDefinition;
}

interface OpenAiFunctionTool {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

type StartRoute = typeof SUGGEST_NODE_NAME | typeof INFRASTRUCTURE_NODE_NAME.CLASSIFY;

const frontendActions = (state: GraphStateType): FrontendToolDefinition[] => {
  const actions = (state.copilotkit as { actions?: unknown } | undefined)?.actions;

  return Array.isArray(actions) ? (actions as FrontendToolDefinition[]) : [];
};

// CopilotKit sends frontend tools either in AG-UI shape or wrapped as an OpenAI function.
const findSuggestTool = (state: GraphStateType): OpenAiFunctionTool | null => {
  for (const action of frontendActions(state)) {
    const definition = action.function ?? action;

    if (definition.name !== COPILOTKIT_SUGGEST_TOOL_NAME) continue;

    return {
      type: 'function',
      function: {
        name: COPILOTKIT_SUGGEST_TOOL_NAME,
        description: definition.description ?? '',
        parameters: definition.parameters ?? {},
      },
    };
  }

  return null;
};

const messageText = (message: BaseMessage): string => {
  const { content } = message;

  if (typeof content === 'string') return content.trim();

  return content
    .map((part) => (typeof part === 'object' && 'text' in part ? String(part.text) : ''))
    .join('')
    .trim();
};

const speakerOf = (message: BaseMessage): string | null => {
  if (message instanceof HumanMessage) return 'User';
  if (message instanceof AIMessage) return 'Assistant';

  return null;
};

// Tool calls and tool results are dropped so the prompt never has unpaired tool_call ids.
const conversationTranscript = (messages: BaseMessage[]): string =>
  messages
    .flatMap((message) => {
      const speaker = speakerOf(message);
      const text = messageText(message);

      return speaker && text ? [`${speaker}: ${text}`] : [];
    })
    .join('\n');

/** True when CopilotKit is generating follow-up suggestions rather than answering the user. */
export const isSuggestionRequest = (state: GraphStateType): boolean =>
  findSuggestTool(state) !== null;

/** Sends suggestion runs past the travel pipeline; every other run starts at classify. */
export const routeFromStart = (state: GraphStateType): StartRoute =>
  isSuggestionRequest(state) ? SUGGEST_NODE_NAME : INFRASTRUCTURE_NODE_NAME.CLASSIFY;

/**
 * Answers a CopilotKit suggestion run with one forced `copilotkitSuggest` call.
 * Skips classification, domain agents, memory extraction, and transcript persistence,
 * which previously re-ran the whole graph (~15s) after every chat turn.
 */
export const suggestNode = async (
  state: GraphStateType,
  config?: RunnableConfig
): Promise<GraphStateUpdate> => {
  const suggestTool = findSuggestTool(state);

  if (!suggestTool) return {};

  const history = state.messages.slice(0, -1).slice(-MAX_SUGGEST_CONTEXT_MESSAGES);
  const instruction = state.messages.at(-1);
  const prompt = [
    `Recent conversation:\n${conversationTranscript(history)}`,
    instruction ? messageText(instruction) : '',
  ].join('\n\n');

  const model = createChatModel({ apiKey: openAiApiKeyFromConfig(config) }).bindTools(
    [suggestTool],
    { tool_choice: { type: 'function', function: { name: COPILOTKIT_SUGGEST_TOOL_NAME } } }
  );
  const response = await withLangfuseTracing(config, 'suggest', (tracedConfig) =>
    model.invoke([new SystemMessage(SUGGEST_SYSTEM_PROMPT), new HumanMessage(prompt)], tracedConfig)
  );

  return { messages: [response] };
};
