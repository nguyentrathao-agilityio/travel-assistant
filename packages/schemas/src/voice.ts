import { z } from 'zod';

import { VOICE_TURN_EVENT_TYPES } from '@repo/constants';

// Ids become store namespace labels and object keys: letters, digits and '-' only.
const voiceAudioIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9-]+$/);

export const VoiceTurnRequestSchema = z.union([
  z.object({
    threadId: z.string().trim().min(1),
    transcript: z.string().trim().min(1),
    messageId: voiceAudioIdSchema.optional(),
    clientDate: z.string().optional(),
    clientTimezone: z.string().optional(),
  }),
  z
    .object({ threadId: z.string().trim().min(1), resume: z.unknown() })
    .strict()
    .refine((body) => body.resume !== undefined, { message: 'resume is required' }),
]);

export const VoiceTurnEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal(VOICE_TURN_EVENT_TYPES.AGENT_CHUNK), text: z.string() }),
  z.object({
    type: z.literal(VOICE_TURN_EVENT_TYPES.TOOL_CALL),
    id: z.string(),
    name: z.string(),
    args: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal(VOICE_TURN_EVENT_TYPES.TOOL_RESULT),
    toolCallId: z.string(),
    name: z.string(),
    result: z.string(),
  }),
  z.object({ type: z.literal(VOICE_TURN_EVENT_TYPES.AGENT_INTERRUPT), value: z.unknown() }),
  z.object({
    type: z.literal(VOICE_TURN_EVENT_TYPES.AGENT_END),
    error: z.object({ code: z.string(), message: z.string() }).optional(),
  }),
  z.object({
    type: z.literal(VOICE_TURN_EVENT_TYPES.SPEECH_SEGMENT),
    seq: z.number().int().nonnegative(),
    text: z.string().min(1),
  }),
  z.object({ type: z.literal(VOICE_TURN_EVENT_TYPES.SPEECH_END) }),
  z.object({
    type: z.literal(VOICE_TURN_EVENT_TYPES.ERROR),
    code: z.string().min(1),
    message: z.string().min(1),
    recoverable: z.boolean(),
  }),
]);

export type VoiceTurnRequest = z.infer<typeof VoiceTurnRequestSchema>;
export type VoiceTurnEvent = z.infer<typeof VoiceTurnEventSchema>;

export const VoiceAudioUploadRequestSchema = z.object({
  threadId: voiceAudioIdSchema,
  messageId: voiceAudioIdSchema,
  byteLength: z.number().int().positive(),
  durationMs: z.number().int().positive(),
});

export const VoiceAudioUploadUrlSchema = z.object({ uploadUrl: z.string().url() });

export const VoiceAudioListSchema = z.object({
  recordings: z.array(z.object({ messageId: z.string(), durationMs: z.number() })),
});

export const VoiceAudioPlaybackUrlSchema = z.object({ url: z.string().url() });

export type VoiceAudioUploadRequest = z.infer<typeof VoiceAudioUploadRequestSchema>;
export type VoiceAudioList = z.infer<typeof VoiceAudioListSchema>;
