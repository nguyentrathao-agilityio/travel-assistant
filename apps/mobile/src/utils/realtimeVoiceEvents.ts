interface RealtimeVoiceMessage {
  type?: unknown;
  transcript?: unknown;
  delta?: unknown;
  item?: { content?: Array<{ transcript?: unknown }> };
  error?: { message?: unknown };
}

/**
 * Matches transcript-completed events loosely (type includes "transcription"
 * and ends with "completed") instead of hardcoding the literal event name, so
 * a minor provider naming change doesn't silently stop transcripts.
 */
export const extractFinalTranscript = (raw: string): string | null => {
  let message: RealtimeVoiceMessage;

  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof message.type !== 'string') return null;
  if (!message.type.includes('transcription') || !message.type.endsWith('completed')) return null;

  const transcript =
    typeof message.transcript === 'string'
      ? message.transcript
      : message.item?.content?.find((part) => typeof part.transcript === 'string')?.transcript;

  return typeof transcript === 'string' && transcript.trim().length > 0 ? transcript.trim() : null;
};

/**
 * Matches transcript-delta events loosely (type includes "transcription" and
 * ends with "delta"). Deltas are append-only text fragments — callers should
 * concatenate them directly, not trim/space-join each one.
 */
export const extractTranscriptDelta = (raw: string): string | null => {
  let message: RealtimeVoiceMessage;

  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof message.type !== 'string') return null;
  if (!message.type.includes('transcription') || !message.type.endsWith('delta')) return null;

  return typeof message.delta === 'string' && message.delta.length > 0 ? message.delta : null;
};

export const extractRealtimeErrorMessage = (raw: string): string | null => {
  let message: RealtimeVoiceMessage;

  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }

  if (message.type !== 'error') return null;

  return typeof message.error?.message === 'string'
    ? message.error.message
    : 'Realtime voice session error';
};
