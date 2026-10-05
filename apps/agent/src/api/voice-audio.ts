import type { Context, Hono } from 'hono';

import {
  VOICE_AUDIO_ERROR_CODES,
  VOICE_AUDIO_MAX_BYTES,
  VOICE_AUDIO_MAX_DURATION_MS,
  VOICE_AUDIO_PATHS,
} from '@repo/constants';
import { VoiceAudioUploadRequestSchema, type VoiceAudioUploadRequest } from '@repo/schemas';

// Constants
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_PAYLOAD_TOO_LARGE,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
  OPENAI_API_KEY_HEADER,
  VOICE_AUDIO_ROUTE_PATTERN,
} from '@/constants';

// Infrastructure
import { memoryStore } from '@/infrastructure/persistence';
import { createVoiceBucket } from '@/infrastructure/storage';

// Services
import {
  VoiceAudioMissingError,
  VoiceAudioUnavailableError,
  createVoiceAudioService,
  type VoiceAudioService,
} from '@/services/voice-audio';

// Utils
import { readJsonBody } from '@/utils';

let defaultService: VoiceAudioService | null = null;

/** Lazily built so importing the routes never opens S3 clients in tests. */
export const getVoiceAudioService = (): VoiceAudioService => {
  defaultService ??= createVoiceAudioService({ bucket: createVoiceBucket(), store: memoryStore });

  return defaultService;
};

const errorResponse = (context: Context, error: unknown) => {
  if (!(error instanceof VoiceAudioUnavailableError)) console.error('[voice-audio]', error);

  return context.json(
    { error: VOICE_AUDIO_ERROR_CODES.UNAVAILABLE },
    HTTP_STATUS_SERVICE_UNAVAILABLE
  );
};

const hasKey = (context: Context) => Boolean(context.req.header(OPENAI_API_KEY_HEADER)?.trim());

const parseUpload = async (context: Context): Promise<VoiceAudioUploadRequest | Response> => {
  const parsed = VoiceAudioUploadRequestSchema.safeParse(await readJsonBody(context.req.raw));

  if (!parsed.success) {
    return context.json(
      { error: VOICE_AUDIO_ERROR_CODES.INVALID_REQUEST },
      HTTP_STATUS_BAD_REQUEST
    );
  }

  if (
    parsed.data.byteLength > VOICE_AUDIO_MAX_BYTES ||
    parsed.data.durationMs > VOICE_AUDIO_MAX_DURATION_MS
  ) {
    return context.json(
      { error: VOICE_AUDIO_ERROR_CODES.TOO_LARGE },
      HTTP_STATUS_PAYLOAD_TOO_LARGE
    );
  }

  return parsed.data;
};

/** Voice recording upload (presigned PUT), confirmation, listing and playback (presigned GET). */
export const registerVoiceAudioRoutes = (
  app: Hono,
  { service }: { service?: VoiceAudioService } = {}
): void => {
  const resolve = () => service ?? getVoiceAudioService();

  app.use(VOICE_AUDIO_ROUTE_PATTERN, async (context, next) => {
    if (!hasKey(context))
      return context.json({ error: VOICE_AUDIO_ERROR_CODES.MISSING_KEY }, HTTP_STATUS_BAD_REQUEST);

    await next();
  });

  app.post(VOICE_AUDIO_PATHS.UPLOAD_URL, async (context) => {
    const upload = await parseUpload(context);

    if (upload instanceof Response) return upload;

    try {
      return context.json({ uploadUrl: await resolve().createUploadUrl(upload) });
    } catch (error) {
      return errorResponse(context, error);
    }
  });

  app.post(VOICE_AUDIO_PATHS.COMPLETE, async (context) => {
    const upload = await parseUpload(context);

    if (upload instanceof Response) return upload;

    try {
      await resolve().completeUpload(upload);

      return context.body(null, HTTP_STATUS_NO_CONTENT);
    } catch (error) {
      if (error instanceof VoiceAudioMissingError) {
        return context.json(
          { error: VOICE_AUDIO_ERROR_CODES.UPLOAD_MISSING },
          HTTP_STATUS_CONFLICT
        );
      }

      return errorResponse(context, error);
    }
  });

  app.get(VOICE_AUDIO_PATHS.LIST, async (context) => {
    try {
      context.header('Cache-Control', 'private, no-store');

      return context.json({
        recordings: await resolve().listRecordings(context.req.param('threadId')),
      });
    } catch (error) {
      return errorResponse(context, error);
    }
  });

  app.get(VOICE_AUDIO_PATHS.PLAYBACK_URL, async (context) => {
    const { threadId, messageId } = context.req.param();

    try {
      return context.json({ url: await resolve().createPlaybackUrl(threadId, messageId) });
    } catch (error) {
      if (error instanceof VoiceAudioMissingError) {
        return context.json({ error: VOICE_AUDIO_ERROR_CODES.NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      return errorResponse(context, error);
    }
  });
};
