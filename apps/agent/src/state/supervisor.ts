import { z } from 'zod';

// Constants
import { DOMAIN_AGENT_NODE_NAMES, FINALIZATION_NODE_NAME } from '@/constants';

// State
import type { GraphError } from './execution';

export const SUPERVISOR_NEXT_NODE_NAMES = [
  ...DOMAIN_AGENT_NODE_NAMES,
  FINALIZATION_NODE_NAME,
] as const;

export const SupervisorStateSchema = z
  .object({
    status: z.enum(['pending', 'complete', 'incomplete', 'failed']).default('pending'),
    nextNode: z.enum(SUPERVISOR_NEXT_NODE_NAMES).optional(),
    reason: z.string().optional(),
  })
  .default(() => ({ status: 'pending' as const }));

export type SupervisorState = z.infer<typeof SupervisorStateSchema>;

export type SupervisorRoute = NonNullable<SupervisorState['nextNode']>;

/** The candidate outcome of validating a domain agent's turn, before folding into SupervisorState. */
export type ValidationResult = {
  status: SupervisorState['status'];
  reason: string;
  missingFields?: string[];
  retryable?: boolean;
  nextNode?: SupervisorRoute;
  error?: GraphError;
};
