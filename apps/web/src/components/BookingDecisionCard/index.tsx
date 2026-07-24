import { CircleAlert } from 'lucide-react';

import { Card, Typography } from '@/components';

type RejectedBookingAction = 'flight' | 'hotel' | 'cancellation';

interface BookingDecisionCardProps {
  action: RejectedBookingAction;
}

const BookingDecisionCard = ({ action }: BookingDecisionCardProps) => {
  const isCancellation = action === 'cancellation';

  return (
    <Card className="w-full max-w-2xl shadow">
      <div className="flex items-start gap-2">
        <CircleAlert size={18} className="text-text-secondary mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <Typography variant="card-title" weight="medium">
            {isCancellation ? 'Cancellation not submitted' : 'Booking not submitted'}
          </Typography>
          <Typography variant="meta" color="secondary" className="mt-1">
            {isCancellation
              ? 'Your booking remains active.'
              : 'Update your selection or traveler details, then try again.'}
          </Typography>
        </div>
      </div>
    </Card>
  );
};

export { BookingDecisionCard };
export type { BookingDecisionCardProps, RejectedBookingAction };
