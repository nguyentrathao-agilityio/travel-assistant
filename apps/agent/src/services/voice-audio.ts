import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import type { BaseStore } from '@langchain/langgraph-checkpoint';

import { VOICE_AUDIO_MIME_TYPE, VOICE_AUDIO_STORE_NAMESPACE } from '@repo/constants';
import type { VoiceAudioUploadRequest } from '@repo/schemas';

// Constants
import {
  VOICE_AUDIO_FILE_EXTENSION,
  VOICE_AUDIO_LIST_LIMIT,
  VOICE_AUDIO_OBJECT_PREFIX,
  VOICE_AUDIO_PLAYBACK_URL_TTL_SECONDS,
  VOICE_AUDIO_UPLOAD_URL_TTL_SECONDS,
  HTTP_STATUS_NOT_FOUND,
} from '@/constants';

import type { VoiceBucket } from '@/infrastructure/storage';

export class VoiceAudioUnavailableError extends Error {}
export class VoiceAudioMissingError extends Error {}

interface StoredRecording {
  key: string;
  durationMs: number;
}

export const voiceAudioKey = (threadId: string, messageId: string): string =>
  `${VOICE_AUDIO_OBJECT_PREFIX}/${threadId}/${messageId}.${VOICE_AUDIO_FILE_EXTENSION}`;

const namespaceOf = (threadId: string) => [VOICE_AUDIO_STORE_NAMESPACE, threadId];

const isNotFound = (error: unknown) =>
  (error as { $metadata?: { httpStatusCode?: number } } | null)?.$metadata?.httpStatusCode ===
    HTTP_STATUS_NOT_FOUND || (error as Error | null)?.name === 'NotFound';

const isRecording = (value: unknown): value is StoredRecording =>
  typeof (value as StoredRecording | null)?.key === 'string' &&
  typeof (value as StoredRecording | null)?.durationMs === 'number';

/** Voice recordings: objects in the bucket, metadata in the LangGraph store (never in graph state). */
export const createVoiceAudioService = ({
  bucket,
  store,
}: {
  bucket: VoiceBucket | null;
  store: BaseStore;
}) => {
  const requireBucket = (): VoiceBucket => {
    if (!bucket) throw new VoiceAudioUnavailableError('Voice bucket is not configured.');

    return bucket;
  };

  const listStored = async (threadId: string) =>
    (await store.search(namespaceOf(threadId), { limit: VOICE_AUDIO_LIST_LIMIT })).flatMap(
      ({ key, value }) => (isRecording(value) ? [{ key, value }] : [])
    );

  return {
    createUploadUrl: async ({ threadId, messageId, byteLength }: VoiceAudioUploadRequest) => {
      const { bucket: name, presign } = requireBucket();

      return presign(
        new PutObjectCommand({
          Bucket: name,
          ContentLength: byteLength,
          ContentType: VOICE_AUDIO_MIME_TYPE,
          Key: voiceAudioKey(threadId, messageId),
        }),
        VOICE_AUDIO_UPLOAD_URL_TTL_SECONDS
      );
    },

    completeUpload: async ({ threadId, messageId, durationMs }: VoiceAudioUploadRequest) => {
      const { bucket: name, client } = requireBucket();
      const key = voiceAudioKey(threadId, messageId);

      try {
        await client.send(new HeadObjectCommand({ Bucket: name, Key: key }));
      } catch (error) {
        if (isNotFound(error)) throw new VoiceAudioMissingError(`No uploaded recording at ${key}.`);

        throw new VoiceAudioUnavailableError('Voice bucket is unreachable.', { cause: error });
      }

      await store.put(namespaceOf(threadId), messageId, { durationMs, key }, false);
    },

    listRecordings: async (threadId: string) => {
      requireBucket();

      return (await listStored(threadId)).map(({ key, value }) => ({
        durationMs: value.durationMs,
        messageId: key,
      }));
    },

    createPlaybackUrl: async (threadId: string, messageId: string) => {
      const { bucket: name, presign } = requireBucket();
      const item = await store.get(namespaceOf(threadId), messageId);

      if (!item || !isRecording(item.value)) {
        throw new VoiceAudioMissingError(`No recording for ${messageId}.`);
      }

      return presign(
        new GetObjectCommand({ Bucket: name, Key: item.value.key }),
        VOICE_AUDIO_PLAYBACK_URL_TTL_SECONDS
      );
    },

    deleteThreadAudio: async (threadId: string) => {
      if (!bucket) return;

      const recordings = await listStored(threadId);

      if (recordings.length === 0) return;

      await bucket.client.send(
        new DeleteObjectsCommand({
          Bucket: bucket.bucket,
          Delete: { Objects: recordings.map(({ value }) => ({ Key: value.key })) },
        })
      );
      await Promise.all(recordings.map(({ key }) => store.delete(namespaceOf(threadId), key)));
    },
  };
};

export type VoiceAudioService = ReturnType<typeof createVoiceAudioService>;
