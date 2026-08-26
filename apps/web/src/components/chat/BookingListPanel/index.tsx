import { A2UIProvider, A2UIRenderer, useA2UIActions } from '@copilotkit/a2ui-renderer';
import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';

import { Button, Typography } from '@/components/common';
import { useTripState } from '@/hooks';
import { useConversationRendererStore } from '@/stores';

import { BOOKINGS_SURFACE_ID, buildBookingsSurface } from './buildBookingsSurface';

import { BOOKING_STATUSES } from '@repo/constants';
import type { Booking } from '@repo/types';

interface BookingListPanelProps {
  open: boolean;
  onClose: () => void;
}

const BookingsSurface = ({ bookings }: { bookings: Booking[] }) => {
  const { processMessages } = useA2UIActions();

  useEffect(() => {
    processMessages(buildBookingsSurface(bookings));
  }, [bookings, processMessages]);

  return <A2UIRenderer surfaceId={BOOKINGS_SURFACE_ID} />;
};

export const BookingListPanel = ({ open, onClose }: BookingListPanelProps) => {
  const { state } = useTripState();
  const sendMessage = useConversationRendererStore((store) => store.sendMessage);

  const handleCancel = useCallback(
    (booking: Booking) => {
      // Don't close the panel — the status card stays open so the caller can watch
      // it update live via A2UI once the cancellation actually completes.
      void sendMessage?.(`Cancel booking ${booking.confirmationCode}.`);
    },
    [sendMessage]
  );

  const bookings = useMemo(
    () =>
      [state?.flightBooking, state?.hotelBooking].filter(
        (booking): booking is Booking => booking !== undefined
      ),
    [state?.flightBooking, state?.hotelBooking]
  );

  if (!open) return null;

  const cancellableBookings = bookings.filter(
    (booking) => booking.status === BOOKING_STATUSES.CONFIRMED
  );

  return (
    <div className="bg-background-primary absolute right-4 top-16 z-[70] flex max-h-[calc(100vh-5rem)] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border shadow-xl">
      <div className="flex items-center justify-between border-b p-4">
        <Typography variant="body" className="font-semibold">
          Bookings
        </Typography>
        <Button variant="ghost" size="sm" aria-label="Close bookings" onClick={onClose}>
          <X size={17} />
        </Button>
      </div>

      <div className="overflow-y-auto p-4">
        {bookings.length === 0 ? (
          <Typography variant="body" color="secondary">
            No confirmed bookings yet.
          </Typography>
        ) : (
          <>
            <A2UIProvider>
              <BookingsSurface bookings={bookings} />
            </A2UIProvider>
            {cancellableBookings.length > 0 && (
              <div className="mt-3 flex flex-col gap-2 border-t pt-3">
                {cancellableBookings.map((booking) => (
                  <Button
                    key={booking.id}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCancel(booking)}
                  >
                    Cancel {booking.confirmationCode}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
