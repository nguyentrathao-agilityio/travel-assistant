import { describe, expect, it } from 'vitest';

// Constants
import { VOICE_APPROVAL_PROMPT_TEXT, VOICE_SPEECH_FLUSH_EVENT_TYPE } from '@/constants';

import { speechStream, type SpeechInputEvent } from '../speech-stream';

const collect = async (events: SpeechInputEvent[], minSegmentLength = 0) => {
  async function* upstream() {
    yield* events;
  }

  const output = [];

  for await (const event of speechStream(upstream(), { minSegmentLength })) output.push(event);

  return output;
};

describe('speechStream', () => {
  it('passes turn events through and adds numbered sentences, ending the batch after agent_end', async () => {
    const output = await collect([
      { type: 'agent_chunk', text: 'Sunny tomorrow. Pack ' },
      { type: 'agent_chunk', text: 'light' },
      { type: 'agent_end' },
    ]);

    expect(output).toEqual([
      { type: 'agent_chunk', text: 'Sunny tomorrow. Pack ' },
      { type: 'speech_segment', seq: 0, text: 'Sunny tomorrow.' },
      { type: 'agent_chunk', text: 'light' },
      { type: 'agent_end' },
      { type: 'speech_segment', seq: 1, text: 'Pack light' },
      { type: 'speech_end' },
    ]);
  });

  it('keeps repeated sentences as separate segments', async () => {
    const output = await collect([
      { type: 'agent_chunk', text: 'OK. OK. ' },
      { type: 'agent_end' },
    ]);

    expect(output.filter((event) => event.type === 'speech_segment')).toEqual([
      { type: 'speech_segment', seq: 0, text: 'OK.' },
      { type: 'speech_segment', seq: 1, text: 'OK.' },
    ]);
  });

  it('speaks buffered text on an internal flush without forwarding the flush', async () => {
    const output = await collect(
      [
        { type: 'agent_chunk', text: 'Short' },
        { type: VOICE_SPEECH_FLUSH_EVENT_TYPE },
        { type: 'agent_end' },
      ],
      40
    );

    expect(output).toEqual([
      { type: 'agent_chunk', text: 'Short' },
      { type: 'speech_segment', seq: 0, text: 'Short' },
      { type: 'agent_end' },
      { type: 'speech_end' },
    ]);
  });

  it('asks for on-screen confirmation and ends the batch on an interrupt', async () => {
    const output = await collect([
      { type: 'agent_chunk', text: 'Booking now' },
      { type: 'agent_interrupt', value: { actionRequests: [] } },
    ]);

    expect(output.slice(-3)).toEqual([
      { type: 'speech_segment', seq: 0, text: 'Booking now' },
      { type: 'speech_segment', seq: 1, text: VOICE_APPROVAL_PROMPT_TEXT },
      { type: 'speech_end' },
    ]);
  });
});
