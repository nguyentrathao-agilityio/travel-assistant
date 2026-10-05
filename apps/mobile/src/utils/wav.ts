import {
  VOICE_AUDIO_BYTES_PER_SAMPLE,
  VOICE_AUDIO_MAX_BYTES,
  VOICE_AUDIO_WAV_HEADER_BYTES,
} from '@repo/constants';

export interface VoiceRecording {
  chunks: ArrayBuffer[];
  byteLength: number;
}

export const VOICE_RECORDING_MAX_PCM_BYTES = VOICE_AUDIO_MAX_BYTES - VOICE_AUDIO_WAV_HEADER_BYTES;

export const pcmDurationMs = (pcmByteLength: number, sampleRate: number): number =>
  Math.round((pcmByteLength / VOICE_AUDIO_BYTES_PER_SAMPLE / sampleRate) * 1000);

/** Wraps 16-bit little-endian mono PCM chunks in a WAV container. */
export const encodeWav = (
  { chunks, byteLength }: VoiceRecording,
  sampleRate: number
): Uint8Array => {
  const wav = new Uint8Array(VOICE_AUDIO_WAV_HEADER_BYTES + byteLength);
  const view = new DataView(wav.buffer);
  const writeText = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1)
      wav[offset + index] = text.charCodeAt(index);
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + byteLength, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * VOICE_AUDIO_BYTES_PER_SAMPLE, true);
  view.setUint16(32, VOICE_AUDIO_BYTES_PER_SAMPLE, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, byteLength, true);

  let offset = VOICE_AUDIO_WAV_HEADER_BYTES;

  for (const chunk of chunks) {
    wav.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  return wav;
};
