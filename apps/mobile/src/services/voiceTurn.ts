import { fetch as expoFetch } from 'expo/fetch';

// Constants
import { OPENAI_API_KEY_HEADER, VOICE_TURN_ERROR_CODES, VOICE_TURN_PATH } from '@repo/constants';
import { VOICE_TURN_MISSING_KEY_STATUS } from '../constants';

// Utils
import { resolveRuntimeUrl } from '../config';
import { createSseParser } from '../utils/sse';
import { parseVoiceTurnEvent, readVoiceTurnErrorCode } from '../utils/voice';

// Storage
import { getApiKey } from '../storage';

// Types
import type { VoiceTurnEvent, VoiceTurnRequest } from '@repo/schemas';

export class VoiceTurnHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string
  ) {
    super(`Voice turn failed (${status}: ${code})`);
    this.name = 'VoiceTurnHttpError';
  }
}

export const voiceTurnUrl = (): string => {
  const runtimeUrl = resolveRuntimeUrl(process.env.EXPO_PUBLIC_RUNTIME_URL);
  const base = new URL(runtimeUrl.replace(/\/chat\/?$/, ''));

  return new URL(VOICE_TURN_PATH, base.origin).toString();
};

interface StreamVoiceTurnOptions {
  body: VoiceTurnRequest;
  signal: AbortSignal;
  onEvent: (event: VoiceTurnEvent) => void;
  fetchImpl?: typeof fetch;
}

/** Posts a voice turn and emits its SSE events as they arrive. */
export const streamVoiceTurn = async ({
  body,
  signal,
  onEvent,
  fetchImpl = expoFetch as unknown as typeof fetch,
}: StreamVoiceTurnOptions): Promise<void> => {
  const apiKey = await getApiKey();

  if (!apiKey)
    throw new VoiceTurnHttpError(VOICE_TURN_MISSING_KEY_STATUS, VOICE_TURN_ERROR_CODES.MISSING_KEY);

  const response = await fetchImpl(voiceTurnUrl(), {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', [OPENAI_API_KEY_HEADER]: apiKey },
    method: 'POST',
    signal,
  });

  if (!response.ok || !response.body) {
    throw new VoiceTurnHttpError(response.status, await readVoiceTurnErrorCode(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser();
  const emit = (payloads: string[]) => {
    for (const payload of payloads) {
      const event = parseVoiceTurnEvent(payload);

      if (event) onEvent(event);
    }
  };

  try {
    let chunk = await reader.read();

    while (!chunk.done) {
      emit(parser.push(decoder.decode(chunk.value, { stream: true })));
      chunk = await reader.read();
    }

    emit(parser.flush());
  } finally {
    reader.releaseLock();
  }
};
