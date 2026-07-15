import { MapPin, Calendar, Users, Plane, Building2, CheckCircle } from 'lucide-react';

// Utils
import { cn, formatDisplayDate } from '@/utils';

// Components
import { Button, Typography } from '@/components';

interface TripSummaryConfirmCardProps {
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  hasBookedFlight: boolean;
  hasBookedHotel: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

const StatusChip = ({
  confirmed,
  label,
  icon: Icon,
}: {
  confirmed: boolean;
  label: string;
  icon: React.ElementType;
}) => (
  <div
    className={cn(
      'text-meta flex items-center gap-1.5 rounded-md px-2.5 py-1',
      confirmed
        ? 'bg-background-success border-border-success text-text-success border'
        : 'border-border-secondary bg-background-secondary text-text-tertiary border'
    )}
  >
    {confirmed ? (
      <CheckCircle size={12} aria-hidden="true" />
    ) : (
      <Icon size={12} aria-hidden="true" />
    )}
    <Typography as="span" variant="meta" color={confirmed ? 'secondary' : 'tertiary'}>
      {confirmed ? `${label} booked` : `No ${label.toLowerCase()}`}
    </Typography>
  </div>
);

/**
 * HITL confirmation card — asks user to confirm before generating the full trip summary.
 * Shows current booking state so user knows what will be included.
 */
const TripSummaryConfirmCard = ({
  destination,
  startDate,
  endDate,
  travelers = 1,
  hasBookedFlight,
  hasBookedHotel,
  onConfirm,
  onCancel,
  className,
}: TripSummaryConfirmCardProps) => (
  <div
    className={cn(
      'border-border-secondary bg-background-primary flex w-full max-w-2xl flex-col gap-4 rounded-lg border px-5 py-4',
      className
    )}
  >
    {/* Question */}
    <div>
      <Typography variant="option-title" weight="medium">
        Would you like me to summarize your trip?
      </Typography>
      <Typography variant="meta" color="tertiary" className="mt-0.5">
        I'll compile your flights, hotel, top places, local tips, suggested route, and estimated
        costs into one card.
      </Typography>
    </div>

    {/* Current state */}
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {destination && (
          <div className="border-border-secondary bg-background-secondary flex items-center gap-1.5 rounded-md border px-2.5 py-1">
            <MapPin size={12} className="text-text-tertiary" aria-hidden="true" />
            <Typography as="span" variant="meta" color="secondary">
              {destination}
            </Typography>
          </div>
        )}

        {startDate && endDate && (
          <div className="border-border-secondary bg-background-secondary flex items-center gap-1.5 rounded-md border px-2.5 py-1">
            <Calendar size={12} className="text-text-tertiary" aria-hidden="true" />
            <Typography as="span" variant="meta" color="secondary">
              {formatDisplayDate(startDate)} – {formatDisplayDate(endDate)}
            </Typography>
          </div>
        )}

        <div className="border-border-secondary bg-background-secondary flex items-center gap-1.5 rounded-md border px-2.5 py-1">
          <Users size={12} className="text-text-tertiary" aria-hidden="true" />
          <Typography as="span" variant="meta" color="secondary">
            {travelers} traveler{travelers !== 1 ? 's' : ''}
          </Typography>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusChip confirmed={hasBookedFlight} label="Flight" icon={Plane} />
        <StatusChip confirmed={hasBookedHotel} label="Hotel" icon={Building2} />
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2">
      <Button variant="primary" size="sm" onClick={onConfirm}>
        Yes, summarize ↗
      </Button>
      <Button variant="secondary" size="sm" onClick={onCancel}>
        No thanks
      </Button>
    </div>
  </div>
);

export { TripSummaryConfirmCard };
