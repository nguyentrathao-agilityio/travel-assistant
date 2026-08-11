import { z } from 'zod';

// Constants
import { MAX_MEMORY_LENGTH } from '@/constants';

export const StoredMemorySchema = z.object({
  memory: z.string(),
});

export const MemoryExtractionSchema = z.object({
  memory: z
    .string()
    .trim()
    .min(1)
    .max(MAX_MEMORY_LENGTH)
    .nullable()
    .describe(
      'A single short, durable fact worth remembering for future requests, or null if the ' +
        "message doesn't state one."
    ),
});
