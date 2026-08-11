import { z } from 'zod';

// Constants
import { DOMAIN_AGENT_NODE_NAMES, FINALIZATION_NODE_NAME } from '@/constants';

const SUPERVISOR_NEXT_NODE_NAMES = [...DOMAIN_AGENT_NODE_NAMES, FINALIZATION_NODE_NAME] as const;

export const SupervisorStateSchema = z
  .object({
    status: z.enum(['pending', 'complete', 'incomplete', 'failed']).default('pending'),
    nextNode: z.enum(SUPERVISOR_NEXT_NODE_NAMES).optional(),
    reason: z.string().optional(),
  })
  .default(() => ({ status: 'pending' as const }));

export type SupervisorState = z.infer<typeof SupervisorStateSchema>;
