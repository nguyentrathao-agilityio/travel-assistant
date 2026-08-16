import { CheckCircle, XCircle } from 'lucide-react';

// Components
import { Typography } from '@/components';

// Utils
import { formatPrice } from '@/utils';

// Types
import type { Booking } from '@repo/types';

interface BookingResultCardProps {
  booking: Booking;
}

const BookingResultCard = ({ booking }: BookingResultCardProps) => {
  const isCancelled = booking.status === 'cancelled';
  const StatusIcon = isCancelled ? XCircle : CheckCircle;

  return (
    <section className="card-typography border-border-tertiary bg-background-primary flex w-full max-w-2xl flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <StatusIcon size={20} className="text-text-secondary mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <Typography variant="card-title" weight="medium">
            {isCancelled ? 'Booking cancelled' : 'Booking confirmed'}
          </Typography>
          <Typography variant="meta" color="secondary" className="mt-1">
            {booking.summary}
          </Typography>
        </div>
      </div>
      <div className="bg-background-secondary grid grid-cols-2 gap-2 rounded-md p-3">
        <div>
          <Typography variant="label" color="tertiary" className="uppercase">
            Confirmation
          </Typography>
          <Typography variant="meta">{booking.confirmationCode}</Typography>
        </div>
        <div>
          <Typography variant="label" color="tertiary" className="uppercase">
            Total
          </Typography>
          <Typography variant="meta">
            {formatPrice(booking.totalPrice, booking.currency)}
          </Typography>
        </div>
      </div>
    </section>
  );
};

export { BookingResultCard };
