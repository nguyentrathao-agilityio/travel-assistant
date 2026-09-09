import type { Flight, HotelAvailability } from '@repo/types';

export type FlightBadgeKind = 'cheapest' | 'fastest' | 'popular';
export type HotelBadgeKind = 'cheapest' | 'bestRated' | 'bestValue';

export const computeFlightBadgeKinds = (flights: Flight[] = []): Map<string, FlightBadgeKind> => {
  const badges = new Map<string, FlightBadgeKind>();

  if (flights.length < 2) return badges;

  const cheapest = flights.reduce((minimum, flight) =>
    flight.price < minimum.price ? flight : minimum
  );
  const fastest = flights.reduce((minimum, flight) =>
    flight.durationMinutes < minimum.durationMinutes ? flight : minimum
  );

  badges.set(cheapest.id, 'cheapest');
  if (fastest.id !== cheapest.id) badges.set(fastest.id, 'fastest');

  if (flights.length >= 3) {
    const untagged = flights.find((flight) => !badges.has(flight.id));

    if (untagged) badges.set(untagged.id, 'popular');
  }

  return badges;
};

export const computeHotelBadgeKinds = (
  hotels: HotelAvailability[]
): Map<string, HotelBadgeKind> => {
  const badges = new Map<string, HotelBadgeKind>();

  if (hotels.length < 2) return badges;

  const cheapest = hotels.reduce((minimum, hotel) =>
    hotel.pricePerNight < minimum.pricePerNight ? hotel : minimum
  );
  const bestRated = hotels.reduce((best, hotel) => (hotel.rating > best.rating ? hotel : best));

  badges.set(cheapest.id, 'cheapest');
  if (bestRated.id !== cheapest.id) badges.set(bestRated.id, 'bestRated');

  if (hotels.length >= 3) {
    const untagged = hotels.find((hotel) => !badges.has(hotel.id));

    if (untagged) badges.set(untagged.id, 'bestValue');
  }

  return badges;
};
