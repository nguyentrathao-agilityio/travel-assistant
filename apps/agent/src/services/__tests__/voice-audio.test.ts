import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import type { BaseStore } from '@langchain/langgraph-checkpoint';
import { describe, expect, it, vi } from 'vitest';

import {
  VoiceAudioMissingError,
  VoiceAudioUnavailableError,
  createVoiceAudioService,
} from '@/services/voice-audio';

const upload = { byteLength: 48044, durationMs: 1000, messageId: 'm1', threadId: 't1' };

const makeStore = (items: { key: string; value: Record<string, unknown> }[] = []) =>
  ({
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(
      async (_ns: string[], key: string) => items.find((item) => item.key === key) ?? null
    ),
    put: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue(items),
  }) as unknown as BaseStore;

const makeBucket = (send = vi.fn().mockResolvedValue({})) => ({
  bucket: 'voice',
  client: { send },
  presign: vi.fn(
    async (command: { constructor: { name: string } }, _expiresIn: number) =>
      `https://signed/${command.constructor.name}`
  ),
});

describe('voice audio service', () => {
  it('signs a PUT for the thread/message key with type and length', async () => {
    const bucket = makeBucket();
    const service = createVoiceAudioService({ bucket, store: makeStore() });

    const url = await service.createUploadUrl(upload);
    const [command, expiresIn] = bucket.presign.mock.calls[0]!;

    expect(url).toBe('https://signed/PutObjectCommand');
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect((command as PutObjectCommand).input).toEqual({
      Bucket: 'voice',
      ContentLength: 48044,
      ContentType: 'audio/wav',
      Key: 'voice/t1/m1.wav',
    });
    expect(expiresIn).toBe(300);
  });

  it('records metadata only after the object exists', async () => {
    const store = makeStore();
    const send = vi.fn().mockResolvedValue({ ContentLength: 48044 });
    const service = createVoiceAudioService({ bucket: makeBucket(send), store });

    await service.completeUpload(upload);

    expect(send.mock.calls[0]![0]).toBeInstanceOf(HeadObjectCommand);
    expect(store.put).toHaveBeenCalledWith(
      ['voice-audio', 't1'],
      'm1',
      { durationMs: 1000, key: 'voice/t1/m1.wav' },
      false
    );
  });

  it('refuses to record metadata when the upload is missing', async () => {
    const send = vi.fn().mockRejectedValue(Object.assign(new Error('nf'), { name: 'NotFound' }));
    const store = makeStore();
    const service = createVoiceAudioService({ bucket: makeBucket(send), store });

    await expect(service.completeUpload(upload)).rejects.toBeInstanceOf(VoiceAudioMissingError);
    expect(store.put).not.toHaveBeenCalled();
  });

  it('reports an unreachable bucket as unavailable rather than a missing upload', async () => {
    const send = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    const store = makeStore();
    const service = createVoiceAudioService({ bucket: makeBucket(send), store });

    await expect(service.completeUpload(upload)).rejects.toBeInstanceOf(VoiceAudioUnavailableError);
    expect(store.put).not.toHaveBeenCalled();
  });

  it('lists recordings and signs playback URLs for known messages only', async () => {
    const bucket = makeBucket();
    const store = makeStore([{ key: 'm1', value: { durationMs: 1000, key: 'voice/t1/m1.wav' } }]);
    const service = createVoiceAudioService({ bucket, store });

    await expect(service.listRecordings('t1')).resolves.toEqual([
      { durationMs: 1000, messageId: 'm1' },
    ]);
    await expect(service.createPlaybackUrl('t1', 'm1')).resolves.toBe(
      'https://signed/GetObjectCommand'
    );
    expect(bucket.presign.mock.calls[0]![0]).toBeInstanceOf(GetObjectCommand);
    expect(bucket.presign.mock.calls[0]![1]).toBe(900);
    await expect(service.createPlaybackUrl('t1', 'nope')).rejects.toBeInstanceOf(
      VoiceAudioMissingError
    );
  });

  it('deletes every recording object and its metadata for a thread', async () => {
    const send = vi.fn().mockResolvedValue({});
    const store = makeStore([
      { key: 'm1', value: { durationMs: 1, key: 'voice/t1/m1.wav' } },
      { key: 'm2', value: { durationMs: 1, key: 'voice/t1/m2.wav' } },
    ]);
    const service = createVoiceAudioService({ bucket: makeBucket(send), store });

    await service.deleteThreadAudio('t1');

    const command = send.mock.calls[0]![0] as DeleteObjectsCommand;
    expect(command).toBeInstanceOf(DeleteObjectsCommand);
    expect(command.input.Delete?.Objects).toEqual([
      { Key: 'voice/t1/m1.wav' },
      { Key: 'voice/t1/m2.wav' },
    ]);
    expect(store.delete).toHaveBeenCalledTimes(2);
  });

  it('reports unavailable when the bucket is not configured', async () => {
    const service = createVoiceAudioService({ bucket: null, store: makeStore() });

    await expect(service.createUploadUrl(upload)).rejects.toBeInstanceOf(
      VoiceAudioUnavailableError
    );
    await expect(service.listRecordings('t1')).rejects.toBeInstanceOf(VoiceAudioUnavailableError);
    await expect(service.deleteThreadAudio('t1')).resolves.toBeUndefined();
  });
});
