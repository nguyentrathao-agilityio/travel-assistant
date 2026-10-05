import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Constants
import {
  VOICE_BUCKET_ACCESS_KEY_ID,
  VOICE_BUCKET_ENDPOINT,
  VOICE_BUCKET_FORCE_PATH_STYLE,
  VOICE_BUCKET_NAME,
  VOICE_BUCKET_REGION,
  VOICE_BUCKET_SECRET_ACCESS_KEY,
} from '@/constants';

export interface VoiceBucket {
  client: Pick<S3Client, 'send'>;
  bucket: string;
  presign(command: PutObjectCommand | GetObjectCommand, expiresIn: number): Promise<string>;
}

/** S3-compatible bucket (Railway Bucket / R2) for voice recordings; `null` when not configured. */
export const createVoiceBucket = (): VoiceBucket | null => {
  if (
    !VOICE_BUCKET_NAME ||
    !VOICE_BUCKET_ENDPOINT ||
    !VOICE_BUCKET_ACCESS_KEY_ID ||
    !VOICE_BUCKET_SECRET_ACCESS_KEY
  ) {
    return null;
  }

  const client = new S3Client({
    credentials: {
      accessKeyId: VOICE_BUCKET_ACCESS_KEY_ID,
      secretAccessKey: VOICE_BUCKET_SECRET_ACCESS_KEY,
    },
    endpoint: VOICE_BUCKET_ENDPOINT,
    forcePathStyle: VOICE_BUCKET_FORCE_PATH_STYLE,
    region: VOICE_BUCKET_REGION,
  });

  return {
    bucket: VOICE_BUCKET_NAME,
    client,
    presign: (command, expiresIn) => getSignedUrl(client, command, { expiresIn }),
  };
};
