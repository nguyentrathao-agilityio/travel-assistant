import { useFrontendTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Constants
import { ACTIONS } from '@/constants';

// Utils
import { isToolPending } from '@/utils';

// Components
import { useTripState } from './useTripState';
import { LoadingCard, FlightOptionItem, HotelOptionItem } from '@/components';

export const useBookedActions = () => {
  const { state } = useTripState();

  useFrontendTool(
    {
      name: ACTIONS.SHOW_BOOKED_FLIGHTS,
      description:
        'Display the currently selected flights as a card. Always call this when the user asks which flight they selected.',
      parameters: z.object({}),
      handler: async () => 'Flights displayed',
      render: ({ status }) => {
        if (isToolPending(status)) return <LoadingCard lines={3} />;

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
    [state.flights]
  );

  useFrontendTool(
    {
      name: ACTIONS.SHOW_BOOKED_HOTEL,
      description:
        'Display the currently selected hotel as a card. Always call this when the user asks which hotel they selected.',
      parameters: z.object({}),
      handler: async () => 'Hotel displayed',
      render: ({ status }) => {
        if (isToolPending(status)) return <LoadingCard lines={3} />;

        const hotel = state.hotel;

        if (!hotel) return <>You have not selected a hotel yet.</>;

        return (
          <div className="border-border-secondary flex w-full max-w-2xl flex-col overflow-hidden rounded-lg border">
            <HotelOptionItem hotel={hotel} isSelected={false} />
          </div>
        );
      },
    },
    [state.hotel]
  );
};
