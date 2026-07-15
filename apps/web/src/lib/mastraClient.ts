import { MastraClient } from '@mastra/client-js';
import { MASTRA_URL } from '@/constants';

export const mastraClient = new MastraClient({ baseUrl: MASTRA_URL });
