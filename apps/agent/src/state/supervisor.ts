import { z } from 'zod';

export const SupervisorStateSchema = z
  .object({
    status: z.enum(['pending', 'complete', 'incomplete', 'failed']).default('pending'),
    nextNode: z
      .enum([
        'explore',
        'plan',
        'bookFlight',
        'bookHotel',
        'cancelBooking',
        'general',
        'saveMemory',
      ])
      .optional(),
    reason: z.string().optional(),
  })
  .default(() => ({ status: 'pending' as const }));
export type SupervisorState = z.infer<typeof SupervisorStateSchema>;
