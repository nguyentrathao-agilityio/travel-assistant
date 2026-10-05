import { fetch as expoFetch } from 'expo/fetch';

// Constants
import {
  OPENAI_API_KEY_HEADER,
  VOICE_AUDIO_MIME_TYPE,
  VOICE_AUDIO_PATHS,
  VOICE_AUDIO_SAMPLE_RATE,
} from '@repo/constants';
import { VOICE_AUDIO_UNAVAILABLE_STATUS } from '../constants';
import {
  VoiceAudioListSchema,
  VoiceAudioPlaybackUrlSchema,
  VoiceAudioUploadUrlSchema,
  type VoiceAudioList,
} from '@repo/schemas';

// Utils
import { resolveRuntimeUrl } from '../config';
import { encodeWav, pcmDurationMs, type VoiceRecording } from '../utils/wav';

// Storage
import { getApiKey } from '../storage';

export class VoiceAudioUnavailableError extends Error {}

const defaultFetch = expoFetch as unknown as typeof fetch;

const agentUrl = (path: string): string => {
  const runtimeUrl = resolveRuntimeUrl(process.env.EXPO_PUBLIC_RUNTIME_URL);

  return new URL(path, new URL(runtimeUrl.replace(/\/chat\/?$/, '')).origin).toString();
};

const keyHeaders = async (): Promise<Record<string, string>> => {
  const apiKey = await getApiKey();

  if (!apiKey) throw new Error('An OpenAI API key is required for voice recordings.');

  return { 'Content-Type': 'application/json', [OPENAI_API_KEY_HEADER]: apiKey };
};

const ensureOk = (response: Response, operation: string) => {
  if (response.status === VOICE_AUDIO_UNAVAILABLE_STATUS)
    throw new VoiceAudioUnavailableError('Voice recordings are unavailable.');
  if (!response.ok) throw new Error(`Voice recording ${operation} failed (${response.status}).`);
};

/** Uploads one utterance as WAV straight to the bucket via a presigned URL, then confirms it. */
export const uploadVoiceRecording = async (
  {
    threadId,
    messageId,
    recording,
  }: { threadId: string; messageId: string; recording: VoiceRecording },
  fetchImpl: typeof fetch = defaultFetch
): Promise<void> => {
  const wav = encodeWav(recording, VOICE_AUDIO_SAMPLE_RATE);
  const payload = JSON.stringify({
    byteLength: wav.length,
    durationMs: Math.max(1, pcmDurationMs(recording.byteLength, VOICE_AUDIO_SAMPLE_RATE)),
    messageId,
    threadId,
  });
  const headers = await keyHeaders();

  const urlResponse = await fetchImpl(agentUrl(VOICE_AUDIO_PATHS.UPLOAD_URL), {
    body: payload,
    headers,
    method: 'POST',
  });

  ensureOk(urlResponse, 'upload URL');

  const { uploadUrl } = VoiceAudioUploadUrlSchema.parse(await urlResponse.json());
  const putResponse = await fetchImpl(uploadUrl, {
    body: wav.buffer as ArrayBuffer,
    headers: { 'Content-Type': VOICE_AUDIO_MIME_TYPE },
    method: 'PUT',
  });

  ensureOk(putResponse, 'upload');

  const completeResponse = await fetchImpl(agentUrl(VOICE_AUDIO_PATHS.COMPLETE), {
    body: payload,
    headers,
    method: 'POST',
  });

  ensureOk(completeResponse, 'confirmation');
};

export const fetchVoiceAudioList = async (
  threadId: string,
  fetchImpl: typeof fetch = defaultFetch
): Promise<VoiceAudioList['recordings']> => {
  const response = await fetchImpl(
    agentUrl(VOICE_AUDIO_PATHS.LIST.replace(':threadId', encodeURIComponent(threadId))),
    {
      headers: await keyHeaders(),
    }
  );

  ensureOk(response, 'list');

  return VoiceAudioListSchema.parse(await response.json()).recordings;
};

export const fetchVoiceAudioPlaybackUrl = async (
  threadId: string,
  messageId: string,
  fetchImpl: typeof fetch = defaultFetch
): Promise<string> => {
  const path = VOICE_AUDIO_PATHS.PLAYBACK_URL.replace(
    ':threadId',
    encodeURIComponent(threadId)
  ).replace(':messageId', encodeURIComponent(messageId));
  const response = await fetchImpl(agentUrl(path), { headers: await keyHeaders() });

  ensureOk(response, 'playback URL');

  return VoiceAudioPlaybackUrlSchema.parse(await response.json()).url;
};
