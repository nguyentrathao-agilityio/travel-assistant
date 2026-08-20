import { AlertCircle, Building2, Plane } from 'lucide-react';
import { useCallback, useState } from 'react';

// Components
import { Button, Typography } from '@/components';

// Utils
import { formatPrice } from '@/utils';

// Types
import type { BookingApprovalRequest, BookingDecision } from '@repo/types';

interface BookingApprovalCardProps {
  request: BookingApprovalRequest;
  onDecision: (decision: BookingDecision) => void;
}

const BookingApprovalCard = ({ request, onDecision }: BookingApprovalCardProps) => {
  const [submitted, setSubmitted] = useState(false);
  const isFlight = request.action === 'create_flight_booking';
  const isCancellation = request.action === 'cancel_booking';
  const BookingIcon = isFlight ? Plane : isCancellation ? AlertCircle : Building2;

  const handleApprove = useCallback(() => {
    setSubmitted(true);
    onDecision('approve');
  }, [onDecision]);

  const handleReject = useCallback(() => {
    setSubmitted(true);
    onDecision('reject');
  }, [onDecision]);

  return (
    <section className="card-typography border-border-tertiary bg-background-primary flex w-full max-w-2xl flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <BookingIcon size={20} className="text-text-secondary mt-0.5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <Typography variant="card-title" weight="medium">
            {request.title}
          </Typography>
        </div>
      </div>

      <dl className="bg-background-secondary grid grid-cols-2 gap-2 rounded-md p-3">
        {Object.entries(request.details).map(([label, value]) => (
          <div key={label} className="min-w-0">
            <Typography as="dt" variant="label" color="tertiary" className="uppercase">
              {label}
            </Typography>
            <Typography as="dd" variant="meta" className="truncate">
              {String(value)}
            </Typography>
          </div>
        ))}
      </dl>

      {request.totalPrice != null && request.currency && (
        <div className="flex items-center justify-between">
          <Typography variant="body" color="secondary">
            Total
          </Typography>
          <Typography variant="option-title" weight="medium">
            {formatPrice(request.totalPrice, request.currency)}
          </Typography>
        </div>
      )}

      <Typography variant="meta" color="tertiary">
        {isCancellation
          ? 'Choose Keep booking to reject this cancellation and leave the booking active.'
          : 'Choose Cancel to stop without creating this booking.'}
      </Typography>

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" disabled={submitted} onClick={handleReject}>
          {isCancellation ? 'Keep booking' : 'Cancel'}
        </Button>
        <Button size="sm" variant="primary" disabled={submitted} onClick={handleApprove}>
          {submitted ? 'Submitting…' : isCancellation ? 'Cancel booking ↗' : 'Confirm booking ↗'}
        </Button>
      </div>
    </section>
  );
};

export { BookingApprovalCard };
