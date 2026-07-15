import { Timer } from 'lucide-react';

// Constants
import { TRAVEL_TRANSPORT_MAP } from '@/constants';

// Utils
import { cn } from '@/utils';

// Types
import type { TravelLeg } from '@repo/types';

export interface LegConnectorProps {
  leg: TravelLeg;
  formatDuration: (min: number) => string;
  className?: string;
}

const LegConnector = ({ leg, formatDuration, className }: LegConnectorProps) => {
  const { icon: ModeIcon, label } = TRAVEL_TRANSPORT_MAP[leg.transport];

  return (
    <div className={cn('flex items-start gap-2 py-0.5 pl-4', className)}>
      <div className="bg-background-secondary border-border-tertiary text-meta font-regular text-text-secondary flex items-center gap-2 rounded-md border px-2.5 py-1">
        <ModeIcon size={12} aria-hidden="true" className="text-icon-transport shrink-0" />
        <span>{label}</span>
        <span className="text-text-tertiary" aria-hidden="true">
          &bull;
        </span>
        <Timer size={11} aria-hidden="true" className="text-icon-time shrink-0" />
        <span>{formatDuration(leg.durationMin)}</span>
        {leg.distanceKm && leg.distanceKm > 0 && (
          <>
            <span className="text-text-tertiary" aria-hidden="true">
              &bull;
            </span>
            <span>{leg.distanceKm} km</span>
          </>
        )}
      </div>
    </div>
  );
};

export { LegConnector };
