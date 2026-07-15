import { useCopilotAction } from '@copilotkit/react-core';

// Constants
import { ACTIONS } from '@/constants';

// Hooks
import { useTripState } from './useTripState';

export const useBookingInfo = () => {
  const { state } = useTripState();

  useCopilotAction({
    name: ACTIONS.GET_FLIGHT_INFO,
    description:
      'Get essential info about the currently booked flight. Call this when you need flight details for reasoning — e.g. price for cost calculation, route to check destination match.',
    handler: async () => {
      const dep = state.flights?.departure;
      const ret = state.flights?.return;

      if (!dep) return JSON.stringify({ booked: false });

      return JSON.stringify({
        booked: true,
        departure: {
          origin: dep.origin,
          destination: dep.destination,
          date: dep.departureTime,
          price: dep.price,
          currency: dep.currency,
          airline: dep.airline.name,
        },
        return: ret
          ? {
              origin: ret.origin,
              destination: ret.destination,
              date: ret.departureTime,
              price: ret.price,
            }
          : null,
      });
    },
  });

  useCopilotAction({
    name: ACTIONS.GET_HOTEL_INFO,
    description:
      'Get essential info about the currently booked hotel. Call this when you need hotel details for reasoning — e.g. price per night for cost calculation, city to check destination match.',
    handler: async () => {
      const hotel = state.hotel;

      if (!hotel) return JSON.stringify({ booked: false });

      return JSON.stringify({
        booked: true,
        name: hotel.name,
        city: hotel.city,
        pricePerNight: hotel.pricePerNight,
        currency: hotel.currency,
        rating: hotel.rating,
        nights: hotel.nights,
      });
    },
  });
};
