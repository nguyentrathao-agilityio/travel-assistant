import { VOICE_TURN_EVENT_TYPES } from '@repo/constants';
import type { VoiceTurnEvent } from '@repo/schemas';

// Constants
import {
  VOICE_APPROVAL_PROMPT_TEXT,
  VOICE_SPEECH_FLUSH_EVENT_TYPE,
  VOICE_SPEECH_MIN_SEGMENT_CHARS,
} from '@/constants';

// Utils
import { createSentenceSegmenter } from '@/utils';

export type SpeechInputEvent = VoiceTurnEvent | { type: typeof VOICE_SPEECH_FLUSH_EVENT_TYPE };

/** Adds numbered speakable sentences (for on-device TTS) to the event stream; each reply ends with `speech_end`. */
export async function* speechStream(
  upstream: AsyncIterable<SpeechInputEvent>,
  { minSegmentLength = VOICE_SPEECH_MIN_SEGMENT_CHARS }: { minSegmentLength?: number } = {}
): AsyncGenerator<VoiceTurnEvent> {
  const newSegmenter = () => createSentenceSegmenter({ minLength: minSegmentLength });
  let segmenter = newSegmenter();
  let seq = 0;

  const segments = (texts: string[]): VoiceTurnEvent[] =>
    texts.map((text) => ({ type: VOICE_TURN_EVENT_TYPES.SPEECH_SEGMENT, seq: seq++, text }));

  const endBatch = (texts: string[]): VoiceTurnEvent[] => {
    segmenter = newSegmenter();

    return [...segments(texts), { type: VOICE_TURN_EVENT_TYPES.SPEECH_END }];
  };

  for await (const event of upstream) {
    if (event.type === VOICE_SPEECH_FLUSH_EVENT_TYPE) {
      yield* segments(segmenter.flush());
      continue;
    }

    yield event;

    switch (event.type) {
      case VOICE_TURN_EVENT_TYPES.AGENT_CHUNK:
        yield* segments(segmenter.push(event.text));
        break;
      case VOICE_TURN_EVENT_TYPES.AGENT_INTERRUPT:
        yield* endBatch([...segmenter.flush(), VOICE_APPROVAL_PROMPT_TEXT]);
        break;
      case VOICE_TURN_EVENT_TYPES.AGENT_END:
        yield* endBatch(segmenter.flush());
        break;
    }
  }
}
