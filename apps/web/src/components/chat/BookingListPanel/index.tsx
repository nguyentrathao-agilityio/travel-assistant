import { A2UIProvider, A2UIRenderer, useA2UIActions } from '@copilotkit/a2ui-renderer';
import { CircleX, X } from 'lucide-react';
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

const BookingsSurface = ({ booking, surfaceId }: { booking: Booking; surfaceId: string }) => {
  const { processMessages } = useA2UIActions();

  useEffect(() => {
    processMessages(buildBookingsSurface([booking], surfaceId));
  }, [booking, processMessages, surfaceId]);

  return <A2UIRenderer surfaceId={surfaceId} />;
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

  return (
    <div className="bg-background-primary absolute right-4 top-16 z-[70] flex max-h-[calc(100vh-5rem)] w-[min(30rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border shadow-xl">
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
          <A2UIProvider>
            <div className="flex flex-col gap-3">
              {bookings.map((booking) => {
                const surfaceId = `${BOOKINGS_SURFACE_ID}-${booking.id}`;

                return (
                  <div
                    key={booking.id}
                    role="group"
                    aria-label={`Booking ${booking.confirmationCode}`}
                    className="relative"
                  >
                    <div
                      className={
                        booking.status === BOOKING_STATUSES.CONFIRMED
                          ? 'booking-ticket-surface min-w-0'
                          : 'min-w-0'
                      }
                    >
                      <BookingsSurface booking={booking} surfaceId={surfaceId} />
                    </div>
                    {booking.status === BOOKING_STATUSES.CONFIRMED && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Cancel ${booking.confirmationCode}`}
                        title="Cancel booking"
                        className="text-text-secondary bg-background-primary/90 absolute right-3 top-3 z-10 h-8 w-8 rounded-full p-0 shadow-sm backdrop-blur-sm hover:text-red-500"
                        onClick={() => handleCancel(booking)}
                      >
                        <CircleX size={17} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </A2UIProvider>
        )}
      </div>
    </div>
  );
};
