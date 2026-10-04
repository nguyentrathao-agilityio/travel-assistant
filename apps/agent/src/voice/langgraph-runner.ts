import type { Client } from '@langchain/langgraph-sdk';

import { GRAPH_ID, VOICE_TURN_ERROR_CODES } from '@repo/constants';

// Constants
import {
  HTTP_STATUS_CONFLICT,
  LANGGRAPH_INTERRUPT_KEY,
  LANGGRAPH_MESSAGE_TYPES,
  LANGGRAPH_STREAM_EVENTS,
  OPENAI_API_KEY_HEADER,
  VOICE_INVALID_KEY_ERROR_PATTERN,
  VOICE_RESPONDER_NODES,
  VOICE_RUN_EVENT_KINDS,
  VOICE_RUN_REQUEST_KINDS,
  VOICE_RUN_STREAM_OPTIONS,
  VOICE_RUNNER_ERROR_MESSAGES,
  VOICE_SUBGRAPH_ACTIVITY_KEYS,
} from '@/constants';

// Utils
import {
  isAiMessage,
  isRecord,
  messageContentText,
  parseStreamEvent,
  type LangGraphStreamMessage,
} from '@/utils';

export type RunRequest =
  | { kind: typeof VOICE_RUN_REQUEST_KINDS.INPUT; transcript: string }
  | { kind: typeof VOICE_RUN_REQUEST_KINDS.RESUME; resume: unknown };

export type RunEvent =
  | { kind: typeof VOICE_RUN_EVENT_KINDS.TEXT; text: string }
  | { kind: typeof VOICE_RUN_EVENT_KINDS.TEXT_END }
  | {
      kind: typeof VOICE_RUN_EVENT_KINDS.TOOL_CALL;
      id: string;
      name: string;
      args: Record<string, unknown>;
    }
  | {
      kind: typeof VOICE_RUN_EVENT_KINDS.TOOL_RESULT;
      toolCallId: string;
      name: string;
      result: string;
    }
  | { kind: typeof VOICE_RUN_EVENT_KINDS.INTERRUPT; value: unknown };

export interface GraphRunner {
  run(request: RunRequest, signal: AbortSignal): AsyncIterable<RunEvent>;
}

type RunnerErrorKey = keyof typeof VOICE_RUNNER_ERROR_MESSAGES;

export type RunnerErrorCode = (typeof VOICE_TURN_ERROR_CODES)[RunnerErrorKey];

export class RunnerError extends Error {
  constructor(
    readonly code: RunnerErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'RunnerError';
  }
}

export const runnerError = (key: RunnerErrorKey): RunnerError =>
  new RunnerError(VOICE_TURN_ERROR_CODES[key], VOICE_RUNNER_ERROR_MESSAGES[key]);

type StreamPayload = NonNullable<Parameters<Client['runs']['stream']>[2]>;

interface LangGraphRunnerOptions {
  client: Pick<Client, 'runs'>;
  threadId: string;
  apiKey: string;
  clientDate?: string;
  clientTimezone?: string;
  assistantId?: string;
}

function* subgraphActivity(data: Record<string, unknown>): Generator<RunEvent> {
  for (const [key, update] of Object.entries(data)) {
    if (!VOICE_SUBGRAPH_ACTIVITY_KEYS.has(key)) continue;

    const messages = (update as { messages?: LangGraphStreamMessage[] } | null)?.messages;

    if (!Array.isArray(messages)) continue;

    for (const message of messages) {
      if (isAiMessage(message)) {
        for (const call of message.tool_calls ?? []) {
          yield {
            kind: VOICE_RUN_EVENT_KINDS.TOOL_CALL,
            id: call.id ?? '',
            name: call.name,
            args: call.args ?? {},
          };
        }
      }

      if (message.type === LANGGRAPH_MESSAGE_TYPES.TOOL) {
        yield {
          kind: VOICE_RUN_EVENT_KINDS.TOOL_RESULT,
          toolCallId: message.tool_call_id ?? '',
          name: message.name ?? 'unknown',
          result:
            typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
        };
      }
    }
  }
}

const toRunnerError = (error: unknown): RunnerError => {
  if (error instanceof RunnerError) return error;

  const status = (error as { status?: number } | null)?.status;

  return runnerError(status === HTTP_STATUS_CONFLICT ? 'THREAD_BUSY' : 'AGENT_FAILED');
};

/** Streams one `travel` run as voice events: responder text, subgraph tool activity, first interrupt. */
async function* streamGraph(
  {
    client,
    threadId,
    apiKey,
    clientDate,
    clientTimezone,
    assistantId = GRAPH_ID,
  }: LangGraphRunnerOptions,
  request: RunRequest,
  signal: AbortSignal
): AsyncGenerator<RunEvent> {
  const payload: StreamPayload = {
    ...(request.kind === VOICE_RUN_REQUEST_KINDS.INPUT
      ? {
          input: {
            messages: [{ role: 'user', content: request.transcript }],
            ...(clientDate && { clientDate }),
            ...(clientTimezone && { clientTimezone }),
          },
        }
      : { command: { resume: request.resume } }),
    ...VOICE_RUN_STREAM_OPTIONS,
    streamMode: [...VOICE_RUN_STREAM_OPTIONS.streamMode],
    config: {
      configurable: {
        copilotkit_forwarded_headers: { [OPENAI_API_KEY_HEADER]: apiKey },
        voiceMode: true,
      },
    },
    signal,
  };
  let hasInterrupted = false;

  try {
    for await (const { event, data } of client.runs.stream(threadId, assistantId, payload)) {
      const { kind, namespace, topNode } = parseStreamEvent(String(event));

      if (kind === LANGGRAPH_STREAM_EVENTS.ERROR) {
        throw runnerError(
          VOICE_INVALID_KEY_ERROR_PATTERN.test(JSON.stringify(data ?? ''))
            ? 'INVALID_KEY'
            : 'AGENT_FAILED'
        );
      }

      if (kind === LANGGRAPH_STREAM_EVENTS.MESSAGES && Array.isArray(data)) {
        const [message, metadata] = data as [LangGraphStreamMessage, { langgraph_node?: string }];
        const node = topNode || metadata?.langgraph_node || '';
        const text =
          isAiMessage(message) && VOICE_RESPONDER_NODES.has(node)
            ? messageContentText(message.content)
            : '';

        if (text) yield { kind: VOICE_RUN_EVENT_KINDS.TEXT, text };

        continue;
      }

      if (kind !== LANGGRAPH_STREAM_EVENTS.UPDATES || !isRecord(data)) continue;

      const [interrupt] = (data[LANGGRAPH_INTERRUPT_KEY] ?? []) as Array<{ value?: unknown }>;

      if (interrupt) {
        if (!hasInterrupted) {
          hasInterrupted = true;
          yield { kind: VOICE_RUN_EVENT_KINDS.INTERRUPT, value: interrupt.value };
        }

        continue;
      }

      if (namespace.length > 0) {
        yield* subgraphActivity(data);
        continue;
      }

      // The responder finished; later nodes (memory, suggestions) add no speech.
      if (Object.keys(data).some((node) => VOICE_RESPONDER_NODES.has(node))) {
        yield { kind: VOICE_RUN_EVENT_KINDS.TEXT_END };
      }
    }
  } catch (error) {
    if (signal.aborted) return;

    throw toRunnerError(error);
  }
}

/** Runs the `travel` graph for one voice turn via the LangGraph SDK. */
export const createLangGraphRunner = (options: LangGraphRunnerOptions): GraphRunner => ({
  run: (request, signal) => streamGraph(options, request, signal),
});
