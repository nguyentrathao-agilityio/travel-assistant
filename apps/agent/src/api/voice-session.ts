import type { Hono } from 'hono';

// Constants
import { OPENAI_API_KEY_HEADER } from '@/constants';

export const REALTIME_VOICE_MODEL = 'gpt-4o-mini-transcribe';

const SESSION_TTL_SECONDS = 300;
const CLIENT_SECRETS_URL = 'https://api.openai.com/v1/realtime/client_secrets';

interface EphemeralVoiceSession {
  token: string;
  expiresAt: number;
}

interface VoiceSessionRouteDependencies {
  createEphemeralSession: (apiKey: string) => Promise<EphemeralVoiceSession>;
}

const requestEphemeralSession = async (apiKey: string): Promise<EphemeralVoiceSession> => {
  const response = await fetch(CLIENT_SECRETS_URL, {
    body: JSON.stringify({
      expires_after: { anchor: 'created_at', seconds: SESSION_TTL_SECONDS },
      session: {
        audio: {
          input: {
            format: { rate: 24000, type: 'audio/pcm' },
            // Transcription sessions never auto-reply by design — LangGraph +
            // expo-speech stay the sole source of the assistant's voice.
            transcription: { model: REALTIME_VOICE_MODEL },
            turn_detection: { type: 'server_vad' },
          },
        },
        type: 'transcription',
      },
    }),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    const body = await response.text();

    // eslint-disable-next-line no-console
    console.error(`OpenAI realtime session request failed (${response.status}): ${body}`);
    throw new Error(`OpenAI realtime session request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { expires_at: number; value: string };

  return { expiresAt: data.expires_at, token: data.value };
};

const defaultDependencies: VoiceSessionRouteDependencies = {
  createEphemeralSession: requestEphemeralSession,
};

/**
 * Mints a short-lived realtime STT session token from the caller's own OpenAI
 * key (same BYOK header as `/chat`) — the key itself never leaves this route.
 */
export const registerVoiceSessionRoutes = (
  app: Hono,
  dependencies: VoiceSessionRouteDependencies = defaultDependencies
): void => {
  app.post('/voice/session', async (context) => {
    const apiKey = context.req.header(OPENAI_API_KEY_HEADER)?.trim();

    if (!apiKey) return context.json({ error: 'missing_key' }, 400);

    try {
      const session = await dependencies.createEphemeralSession(apiKey);

      return context.json({
        expiresAt: session.expiresAt,
        model: REALTIME_VOICE_MODEL,
        token: session.token,
      });
    } catch {
      return context.json({ error: 'voice_session_unavailable' }, 503);
    }
  });
};
