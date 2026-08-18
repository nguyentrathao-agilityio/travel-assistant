import type { Hono } from 'hono';
import { cors } from 'hono/cors';

// Constants
import { OPENAI_API_KEY_HEADER } from '@/constants';

// Infrastructure
import { verifyOpenAiApiKey } from '@/infrastructure/llm';

type VerificationErrorCode =
  | 'missing_key'
  | 'invalid_format'
  | 'invalid_key'
  | 'model_forbidden'
  | 'rate_limited'
  | 'verification_unavailable';

interface OpenAiKeyRouteDependencies {
  verify: (apiKey: string) => Promise<void>;
}

const defaultDependencies: OpenAiKeyRouteDependencies = {
  verify: verifyOpenAiApiKey,
};

const jsonResponse = (status: number, valid: boolean, error?: VerificationErrorCode) =>
  new Response(JSON.stringify(error ? { valid, error } : { valid }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const providerError = (error: unknown): [number, VerificationErrorCode] => {
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: unknown }).status)
      : undefined;

  if (status === 401) return [401, 'invalid_key'];
  if (status === 403) return [403, 'model_forbidden'];
  if (status === 429) return [429, 'rate_limited'];

  return [503, 'verification_unavailable'];
};

export const registerOpenAiKeyRoutes = (
  app: Hono,
  dependencies: OpenAiKeyRouteDependencies = defaultDependencies
): void => {
  app.use(
    '/auth/openai/*',
    cors({
      origin: '*',
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: [OPENAI_API_KEY_HEADER, 'Content-Type'],
      credentials: false,
      maxAge: 86400,
    })
  );

  app.post('/auth/openai/verify', async (context) => {
    const apiKey = context.req.header(OPENAI_API_KEY_HEADER)?.trim();

    if (!apiKey) return jsonResponse(400, false, 'missing_key');
    if (!apiKey.startsWith('sk-')) return jsonResponse(400, false, 'invalid_format');

    try {
      await dependencies.verify(apiKey);

      return jsonResponse(200, true);
    } catch (error) {
      const [status, code] = providerError(error);

      return jsonResponse(status, false, code);
    }
  });
};
