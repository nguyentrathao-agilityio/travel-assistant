import { AlertCircle, Building2, Plane } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button, Typography } from '@/components';
import { formatPrice } from '@repo/utils';

// Constants
import { BOOKING_ACTIONS, BOOKING_DECISIONS } from '@repo/constants';

// Types
import type { BookingApprovalRequest, BookingDecision } from '@repo/types';

type EditableBookingDetails = Record<string, string | number | boolean | null>;

// Reference identifiers tie the approval to a specific, already-revalidated search
// result — changing them here wouldn't re-run availability/price revalidation, so they
// display but never become an editable input.
const NON_EDITABLE_DETAIL_KEYS = new Set(['flightId', 'hotelId']);

interface BookingApprovalCardProps {
  request: BookingApprovalRequest;
  onDecision: (decision: BookingDecision, editedDetails?: EditableBookingDetails) => void;
}

const BookingApprovalCard = ({ request, onDecision }: BookingApprovalCardProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState<EditableBookingDetails>(request.details);
  const [hasSavedChanges, setHasSavedChanges] = useState(false);
  const isFlight = request.action === BOOKING_ACTIONS.CREATE_FLIGHT;
  const isCancellation = request.action === BOOKING_ACTIONS.CANCEL;
  const canEdit = !isCancellation && request.allowedDecisions.includes(BOOKING_DECISIONS.EDIT);
  const BookingIcon = isFlight ? Plane : isCancellation ? AlertCircle : Building2;

  const handleConfirm = useCallback(() => {
    setSubmitted(true);
    onDecision(
      hasSavedChanges ? BOOKING_DECISIONS.EDIT : BOOKING_DECISIONS.APPROVE,
      hasSavedChanges ? editedDetails : undefined
    );
  }, [editedDetails, hasSavedChanges, onDecision]);

  const handleReject = useCallback(() => {
    setSubmitted(true);
    onDecision(BOOKING_DECISIONS.REJECT);
  }, [onDecision]);

  const handleSaveChanges = useCallback(() => {
    setHasSavedChanges(true);
    setIsEditing(false);
  }, []);

  const handleDiscardChanges = useCallback(() => {
    setEditedDetails(request.details);
    setIsEditing(false);
  }, [request.details]);

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
        {Object.entries(editedDetails).map(([label, value]) => (
          <div key={label} className="min-w-0">
            <Typography as="dt" variant="label" color="tertiary" className="uppercase">
              {label}
            </Typography>
            {isEditing && !NON_EDITABLE_DETAIL_KEYS.has(label) ? (
              <input
                aria-label={label}
                className="border-border-secondary bg-background-primary text-text-primary mt-1 w-full rounded-md border px-2 py-1"
                type={typeof request.details[label] === 'number' ? 'number' : 'text'}
                value={String(value ?? '')}
                onChange={(event) =>
                  setEditedDetails((current) => ({
                    ...current,
                    [label]:
                      typeof request.details[label] === 'number'
                        ? Number(event.target.value)
                        : event.target.value,
                  }))
                }
              />
            ) : (
              <Typography as="dd" variant="meta" className="truncate">
                {String(value)}
              </Typography>
            )}
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
          : hasSavedChanges
            ? 'Review the updated details, then confirm to create this booking.'
            : 'Choose Cancel to stop without creating this booking.'}
      </Typography>

      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button size="sm" variant="secondary" onClick={handleDiscardChanges}>
              Discard changes
            </Button>
            <Button size="sm" variant="primary" onClick={handleSaveChanges}>
              Save changes
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="secondary" disabled={submitted} onClick={handleReject}>
              {isCancellation ? 'Keep booking' : 'Cancel'}
            </Button>
            {canEdit && (
              <Button
                size="sm"
                variant="secondary"
                disabled={submitted}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
            <Button size="sm" variant="primary" disabled={submitted} onClick={handleConfirm}>
              {submitted
                ? 'Submitting…'
                : isCancellation
                  ? 'Cancel booking ↗'
                  : 'Confirm booking ↗'}
            </Button>
          </>
        )}
      </div>
    </section>
  );
};

export { BookingApprovalCard };
