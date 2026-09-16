import { OPENAI_API_KEY_HEADER } from '@repo/constants';

import { resolveRuntimeUrl } from '../config';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { getApiKey } from './apiKeyStorage';

interface VoiceSessionToken {
  token: string;
  model: string;
}

const voiceSessionUrl = (): string => {
  const runtimeUrl = resolveRuntimeUrl(process.env.EXPO_PUBLIC_RUNTIME_URL);
  const base = new URL(runtimeUrl.replace(/\/chat\/?$/, ''));

  return new URL('/voice/session', base.origin).toString();
};

/**
 * Fetches a short-lived OpenAI Realtime session token, minted server-side from
 * the same user-supplied OpenAI key used for chat (bring-your-own-key) — the
 * key itself is sent once over HTTPS to mint the token, never stored remotely.
 */
export const fetchVoiceSessionToken = async (): Promise<VoiceSessionToken> => {
  const apiKey = await getApiKey();

  if (!apiKey) throw new Error('An OpenAI API key is required for voice.');

  let response: Response;

  try {
    response = await fetchWithTimeout(
      voiceSessionUrl(),
      { headers: { [OPENAI_API_KEY_HEADER]: apiKey }, method: 'POST' },
      10000
    );
  } catch {
    throw new Error('Voice session is unavailable.');
  }

  if (!response.ok) throw new Error('Voice session is unavailable.');

  const data = (await response.json()) as { model?: unknown; token?: unknown };

  if (typeof data.token !== 'string' || typeof data.model !== 'string') {
    throw new Error('Voice session response was invalid.');
  }

  return { model: data.model, token: data.token };
};
