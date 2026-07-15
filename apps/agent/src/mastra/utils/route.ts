import type { TransportMode } from '@repo/schemas';

import { ROUTE_MODE_MAP } from '@/constants';

export const mapRouteMode = (mode: string): TransportMode =>
  (ROUTE_MODE_MAP[mode] as TransportMode) ?? 'taxi';
