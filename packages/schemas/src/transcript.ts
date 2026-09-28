import { z } from 'zod';

export const TranscriptMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['user', 'assistant', 'tool']),
  content: z.unknown(),
  toolCallId: z.string().min(1).optional(),
  toolCalls: z.array(z.unknown()).optional(),
});

export const TranscriptCursorSchema = z.object({
  version: z.literal(1),
  threadId: z.string().min(1),
  beforeSequence: z.number().int().positive(),
});

export const TranscriptPageSchema = z
  .object({
    messages: z.array(TranscriptMessageSchema),
    previousCursor: z.string().min(1).nullable(),
    hasPreviousPage: z.boolean(),
  })
  .refine((page) => page.hasPreviousPage === (page.previousCursor !== null));

export type TranscriptMessage = z.infer<typeof TranscriptMessageSchema>;
export type TranscriptCursor = z.infer<typeof TranscriptCursorSchema>;
export type TranscriptPage = z.infer<typeof TranscriptPageSchema>;
