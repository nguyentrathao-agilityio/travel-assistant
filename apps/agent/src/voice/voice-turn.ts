import { VOICE_TURN_EVENT_TYPES } from '@repo/constants';
import type { VoiceTurnEvent } from '@repo/schemas';

// Constants
import { VOICE_RUN_EVENT_KINDS, VOICE_SPEECH_FLUSH_EVENT_TYPE } from '@/constants';

import {
  RunnerError,
  runnerError,
  type GraphRunner,
  type RunEvent,
  type RunRequest,
} from './langgraph-runner';
import { speechStream, type SpeechInputEvent } from './speech-stream';

const toEvent = (event: RunEvent): SpeechInputEvent | null => {
  switch (event.kind) {
    case VOICE_RUN_EVENT_KINDS.TEXT:
      return event.text ? { type: VOICE_TURN_EVENT_TYPES.AGENT_CHUNK, text: event.text } : null;
    case VOICE_RUN_EVENT_KINDS.TEXT_END:
      return { type: VOICE_SPEECH_FLUSH_EVENT_TYPE };
    case VOICE_RUN_EVENT_KINDS.TOOL_CALL: {
      const { kind, ...toolCall } = event;

      return { type: VOICE_TURN_EVENT_TYPES.TOOL_CALL, ...toolCall };
    }
    case VOICE_RUN_EVENT_KINDS.TOOL_RESULT: {
      const { kind, ...toolResult } = event;

      return { type: VOICE_TURN_EVENT_TYPES.TOOL_RESULT, ...toolResult };
    }
    case VOICE_RUN_EVENT_KINDS.INTERRUPT:
      return { type: VOICE_TURN_EVENT_TYPES.AGENT_INTERRUPT, value: event.value };
  }
};

/** Maps runner events to turn events; ends with `agent_end` (with error) unless interrupted. */
async function* agentEvents(
  request: RunRequest,
  runner: GraphRunner,
  signal: AbortSignal
): AsyncGenerator<SpeechInputEvent> {
  let interrupted = false;

  try {
    // Keep draining after an interrupt: closing early cancels the run.
    for await (const runEvent of runner.run(request, signal)) {
      if (interrupted) continue;

      const event = toEvent(runEvent);

      if (!event) continue;

      yield event;

      if (event.type === VOICE_TURN_EVENT_TYPES.AGENT_INTERRUPT) interrupted = true;
    }

    if (!interrupted) yield { type: VOICE_TURN_EVENT_TYPES.AGENT_END };
  } catch (error) {
    const { code, message } = error instanceof RunnerError ? error : runnerError('AGENT_FAILED');

    yield { type: VOICE_TURN_EVENT_TYPES.AGENT_END, error: { code, message } };
  }
}

/** Voice turn pipeline: graph run → turn events → speakable sentences for on-device TTS. */
export const runVoiceTurn = (
  request: RunRequest,
  { runner, signal }: { runner: GraphRunner; signal: AbortSignal }
): AsyncGenerator<VoiceTurnEvent> => speechStream(agentEvents(request, runner, signal));
