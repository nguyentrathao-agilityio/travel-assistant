import { Client } from '@langchain/langgraph-sdk';
import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

import { VOICE_TURN_ERROR_CODES, VOICE_TURN_PATH } from '@repo/constants';
import { VoiceTurnRequestSchema, type VoiceTurnRequest } from '@repo/schemas';

// Constants
import {
  HTTP_STATUS_BAD_REQUEST,
  LANGGRAPH_DEPLOYMENT_URL,
  OPENAI_API_KEY_HEADER,
  VOICE_RUN_REQUEST_KINDS,
} from '@/constants';

// Utils
import { readJsonBody } from '@/utils';

// Voice
import { createLangGraphRunner, type GraphRunner, type RunRequest } from '@/voice/langgraph-runner';
import { runVoiceTurn } from '@/voice/voice-turn';

interface RunnerInput {
  threadId: string;
  apiKey: string;
  clientDate?: string;
  clientTimezone?: string;
}

interface VoiceTurnRouteDependencies {
  createRunner(input: RunnerInput): GraphRunner;
}

type ClientContext = Pick<RunnerInput, 'clientDate' | 'clientTimezone'>;

const toRunRequest = (
  body: VoiceTurnRequest
): { request: RunRequest; clientContext: ClientContext } => {
  if (!('transcript' in body)) {
    return {
      clientContext: {},
      request: { kind: VOICE_RUN_REQUEST_KINDS.RESUME, resume: body.resume },
    };
  }

  const { transcript, clientDate, clientTimezone } = body;

  return {
    clientContext: { clientDate, clientTimezone },
    request: { kind: VOICE_RUN_REQUEST_KINDS.INPUT, transcript },
  };
};

const createDefaultDependencies = (): VoiceTurnRouteDependencies => {
  const client = new Client({ apiUrl: LANGGRAPH_DEPLOYMENT_URL });

  return {
    createRunner: (input) => createLangGraphRunner({ client, ...input }),
  };
};

/** POST /voice/turn: checks the BYOK key and body, then streams the turn as SSE; disconnect aborts the run. */
export const registerVoiceTurnRoutes = (
  app: Hono,
  dependencies: VoiceTurnRouteDependencies = createDefaultDependencies()
): void => {
  app.post(VOICE_TURN_PATH, async (context) => {
    const apiKey = context.req.header(OPENAI_API_KEY_HEADER)?.trim();

    if (!apiKey) {
      return context.json({ error: VOICE_TURN_ERROR_CODES.MISSING_KEY }, HTTP_STATUS_BAD_REQUEST);
    }

    const parsed = VoiceTurnRequestSchema.safeParse(await readJsonBody(context.req.raw));

    if (!parsed.success) {
      return context.json(
        { error: VOICE_TURN_ERROR_CODES.INVALID_REQUEST },
        HTTP_STATUS_BAD_REQUEST
      );
    }

    const { threadId } = parsed.data;
    const { request, clientContext } = toRunRequest(parsed.data);
    const runner = dependencies.createRunner({ apiKey, threadId, ...clientContext });
    const controller = new AbortController();

    context.req.raw.signal.addEventListener('abort', () => controller.abort(), { once: true });

    return streamSSE(context, async (stream) => {
      stream.onAbort(() => controller.abort());

      for await (const event of runVoiceTurn(request, { runner, signal: controller.signal })) {
        if (controller.signal.aborted) break;

        await stream.writeSSE({ data: JSON.stringify(event) });
      }
    });
  });
};
