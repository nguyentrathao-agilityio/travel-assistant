import { useAgentContext } from '@copilotkit/react-core/v2';
import { useMemo } from 'react';

import { useTripState } from './useTripState';

export const useBookingContext = () => {
  const { state } = useTripState();

  const value = useMemo(() => {
    const departure = state.flights?.departure;
    const returnFlight = state.flights?.return;
    const hotel = state.hotel;

    return {
      flights: departure
        ? {
            departure: {
              origin: departure.origin,
              destination: departure.destination,
              date: departure.departureTime,
              price: departure.price,
              currency: departure.currency,
              airline: departure.airline.name,
            },
            return: returnFlight
              ? {
                  origin: returnFlight.origin,
                  destination: returnFlight.destination,
                  date: returnFlight.departureTime,
                  price: returnFlight.price,
                }
              : null,
          }
        : null,
      hotel: hotel
        ? {
            name: hotel.name,
            city: hotel.city,
            pricePerNight: hotel.pricePerNight,
            currency: hotel.currency,
            rating: hotel.rating,
            nights: hotel.nights,
          }
        : null,
    };
  }, [state.flights, state.hotel]);

  useAgentContext({
    description:
      'Current booking state for agent reasoning. Use show-booked-flights or show-booked-hotel only when the user asks to display a selection.',
    value,
  });
};
