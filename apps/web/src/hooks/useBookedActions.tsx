import { useFrontendTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Constants
import { ACTIONS } from '@/constants';

// Utils
import { isToolPending } from '@/utils';

// Components
import { useTripState } from './useTripState';
import { BookingResultCard, LoadingCard, FlightOptionItem, HotelOptionItem } from '@/components';

export const useBookedActions = () => {
  const { state } = useTripState();

  useFrontendTool(
    {
      name: ACTIONS.SHOW_BOOKED_FLIGHTS,
      description:
        'Display the currently selected flights as a card. Only call this when the user explicitly asks a standalone question like "which flight did I pick?" or "what did I select?" — never call this while collecting passenger details or preparing a booking confirmation. During an active booking flow, use the flight ID already known from the search results earlier in this conversation instead; calling this tool there can incorrectly report no selection even when one was made conversationally.',
      parameters: z.object({}),
      handler: async () => 'Flights displayed',
      render: ({ status }) => {
        if (isToolPending(status)) return <LoadingCard lines={3} />;

        if (state.flightBooking) return <BookingResultCard booking={state.flightBooking} />;

        const departure = state.flights?.departure;
        const returnFlight = state.flights?.return;

        if (!departure && !returnFlight) return <>You have not selected any flights yet.</>;

        return (
          <div className="border-border-secondary flex w-full max-w-2xl flex-col overflow-hidden rounded-lg border">
            {departure && <FlightOptionItem flight={departure} isSelected={false} />}
            {returnFlight && (
              <>
                {departure && <div className="border-border-secondary border-t" />}
                <FlightOptionItem flight={returnFlight} isSelected={false} />
              </>
            )}
          </div>
        );
      },
    },
    [state.flights, state.flightBooking]
  );

  useFrontendTool(
    {
      name: ACTIONS.SHOW_BOOKED_HOTEL,
      description:
        'Display the currently selected hotel as a card. Only call this when the user explicitly asks a standalone question like "which hotel did I pick?" or "what did I select?" — never call this while collecting guest details or preparing a booking confirmation. During an active booking flow, use the hotel ID already known from the search results earlier in this conversation instead; calling this tool there can incorrectly report no selection even when one was made conversationally.',
      parameters: z.object({}),
      handler: async () => 'Hotel displayed',
      render: ({ status }) => {
        if (isToolPending(status)) return <LoadingCard lines={3} />;

        if (state.hotelBooking) return <BookingResultCard booking={state.hotelBooking} />;

        const hotel = state.hotel;

        if (!hotel) return <>You have not selected a hotel yet.</>;

        return (
          <div className="border-border-secondary flex w-full max-w-2xl flex-col overflow-hidden rounded-lg border">
            <HotelOptionItem hotel={hotel} isSelected={false} />
          </div>
        );
      },
    },
    [state.hotel, state.hotelBooking]
  );
};
