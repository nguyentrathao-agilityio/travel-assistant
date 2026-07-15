import { z } from 'zod';

export const ToolErrorSchema = z.object({ error: z.string() });
