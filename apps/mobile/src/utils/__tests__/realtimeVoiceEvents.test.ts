import {
  extractFinalTranscript,
  extractRealtimeErrorMessage,
  extractTranscriptDelta,
} from '../realtimeVoiceEvents';

describe('extractFinalTranscript', () => {
  test('extracts the transcript from a top-level transcript field', () => {
    const raw = JSON.stringify({
      type: 'conversation.item.input_audio_transcription.completed',
      transcript: 'Plan a trip to Hue',
    });

    expect(extractFinalTranscript(raw)).toBe('Plan a trip to Hue');
  });

  test('falls back to item.content when there is no top-level transcript', () => {
    const raw = JSON.stringify({
      type: 'conversation.item.input_audio_transcription.completed',
      item: { content: [{ foo: 'bar' }, { transcript: 'Hello there' }] },
    });

    expect(extractFinalTranscript(raw)).toBe('Hello there');
  });

  test('trims whitespace around the transcript', () => {
    const raw = JSON.stringify({
      type: 'conversation.item.input_audio_transcription.completed',
      transcript: '  padded  ',
    });

    expect(extractFinalTranscript(raw)).toBe('padded');
  });

  test('returns null for a blank transcript', () => {
    const raw = JSON.stringify({
      type: 'conversation.item.input_audio_transcription.completed',
      transcript: '   ',
    });

    expect(extractFinalTranscript(raw)).toBeNull();
  });

  test('matches event types loosely as long as they include "transcription" and end with "completed"', () => {
    const raw = JSON.stringify({
      type: 'custom.transcription.something.completed',
      transcript: 'loose match',
    });

    expect(extractFinalTranscript(raw)).toBe('loose match');
  });

  test('returns null when the type does not include "transcription"', () => {
    const raw = JSON.stringify({ type: 'response.audio.completed', transcript: 'ignored' });

    expect(extractFinalTranscript(raw)).toBeNull();
  });

  test('returns null when the type does not end with "completed"', () => {
    const raw = JSON.stringify({
      type: 'conversation.item.input_audio_transcription.delta',
      transcript: 'ignored',
    });

    expect(extractFinalTranscript(raw)).toBeNull();
  });

  test('returns null when type is missing or not a string', () => {
    expect(extractFinalTranscript(JSON.stringify({ transcript: 'no type' }))).toBeNull();
    expect(extractFinalTranscript(JSON.stringify({ type: 42, transcript: 'x' }))).toBeNull();
  });

  test('returns null for invalid JSON', () => {
    expect(extractFinalTranscript('not json')).toBeNull();
  });

  test('returns null when neither transcript source is present', () => {
    const raw = JSON.stringify({ type: 'conversation.item.input_audio_transcription.completed' });

    expect(extractFinalTranscript(raw)).toBeNull();
  });

  test('returns null when item.content has no transcript entries', () => {
    const raw = JSON.stringify({
      type: 'conversation.item.input_audio_transcription.completed',
      item: { content: [{ foo: 'bar' }] },
    });

    expect(extractFinalTranscript(raw)).toBeNull();
  });
});

describe('extractTranscriptDelta', () => {
  test('extracts the delta field from a delta event', () => {
    const raw = JSON.stringify({
      type: 'conversation.item.input_audio_transcription.delta',
      delta: 'Plan a ',
    });

    expect(extractTranscriptDelta(raw)).toBe('Plan a ');
  });

  test('does not trim the delta — fragments are append-only', () => {
    const raw = JSON.stringify({
      type: 'conversation.item.input_audio_transcription.delta',
      delta: '  trip  ',
    });

    expect(extractTranscriptDelta(raw)).toBe('  trip  ');
  });

  test('matches event types loosely as long as they include "transcription" and end with "delta"', () => {
    const raw = JSON.stringify({
      type: 'custom.transcription.something.delta',
      delta: 'loose match',
    });

    expect(extractTranscriptDelta(raw)).toBe('loose match');
  });

  test('returns null when the type does not end with "delta"', () => {
    const raw = JSON.stringify({
      type: 'conversation.item.input_audio_transcription.completed',
      delta: 'ignored',
    });

    expect(extractTranscriptDelta(raw)).toBeNull();
  });

  test('returns null when the type does not include "transcription"', () => {
    const raw = JSON.stringify({ type: 'response.audio.delta', delta: 'ignored' });

    expect(extractTranscriptDelta(raw)).toBeNull();
  });

  test('returns null for an empty delta', () => {
    const raw = JSON.stringify({
      type: 'conversation.item.input_audio_transcription.delta',
      delta: '',
    });

    expect(extractTranscriptDelta(raw)).toBeNull();
  });

  test('returns null when delta is missing or not a string', () => {
    expect(
      extractTranscriptDelta(
        JSON.stringify({ type: 'conversation.item.input_audio_transcription.delta' })
      )
    ).toBeNull();
    expect(
      extractTranscriptDelta(
        JSON.stringify({ type: 'conversation.item.input_audio_transcription.delta', delta: 42 })
      )
    ).toBeNull();
  });

  test('returns null for invalid JSON', () => {
    expect(extractTranscriptDelta('not json')).toBeNull();
  });
});

describe('extractRealtimeErrorMessage', () => {
  test('extracts the error message from an error event', () => {
    const raw = JSON.stringify({ type: 'error', error: { message: 'Rate limited' } });

    expect(extractRealtimeErrorMessage(raw)).toBe('Rate limited');
  });

  test('falls back to a default message when error.message is missing', () => {
    const raw = JSON.stringify({ type: 'error', error: {} });

    expect(extractRealtimeErrorMessage(raw)).toBe('Realtime voice session error');
  });

  test('falls back to a default message when error is missing entirely', () => {
    const raw = JSON.stringify({ type: 'error' });

    expect(extractRealtimeErrorMessage(raw)).toBe('Realtime voice session error');
  });

  test('returns null for non-error event types', () => {
    const raw = JSON.stringify({ type: 'response.done' });

    expect(extractRealtimeErrorMessage(raw)).toBeNull();
  });

  test('returns null for invalid JSON', () => {
    expect(extractRealtimeErrorMessage('not json')).toBeNull();
  });
});
