import { z } from 'zod';

const KnownMessagePartSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.literal('tool-invocation'),
    toolInvocation: z.object({
      state: z.string(),
      toolCallId: z.string(),
      toolName: z.string(),
      args: z.record(z.unknown()).optional().default({}),
      result: z.unknown().optional(),
    }),
  }),
]);

const MessagePartSchema = z.union([KnownMessagePartSchema, z.object({ type: z.string() })]);

const RawMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  content: z.union([
    z.string(),
    z.object({
      parts: z.array(MessagePartSchema).optional(),
      content: z.string().optional(),
    }),
  ]),
});

export const ThreadMessagesResponseSchema = z.object({
  messages: z.array(RawMessageSchema).default([]),
});

export type ThreadMessagesResponse = z.infer<typeof ThreadMessagesResponseSchema>;
