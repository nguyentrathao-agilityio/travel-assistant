// State
import type { GraphStateType } from '@/state';

const yamlValue = (value: string | number | undefined): string =>
  value === undefined || value === '' ? 'null' : String(value);

const describeHotel = (hotel: GraphStateType['hotel']): string => {
  if (!hotel) return 'hotel: null';

  return [
    'hotel:',
    `  id: ${hotel.id}`,
    `  name: ${hotel.name}`,
    `  city: ${hotel.city}`,
    `  pricePerNight: ${hotel.pricePerNight}`,
    `  totalPrice: ${hotel.totalPrice}`,
    `  currency: ${hotel.currency}`,
    `  nights: ${hotel.nights}`,
  ].join('\n');
};

const describeFlights = (flights: GraphStateType['flights']): string => {
  if (!flights?.departure && !flights?.return) return 'flights: null';

  const lines = ['flights:'];

  if (flights.departure) {
    lines.push(
      'departure:',
      `  airline: ${flights.departure.airline.name}`,
      `  flightNumber: ${flights.departure.flightNumber}`,
      `  origin: ${flights.departure.origin}`,
      `  destination: ${flights.departure.destination}`,
      `  departureTime: ${flights.departure.departureTime}`,
      `  price: ${flights.departure.price}`,
      `  currency: ${flights.departure.currency}`
    );
  }

  if (flights.return) {
    lines.push(
      'return:',
      `  airline: ${flights.return.airline.name}`,
      `  flightNumber: ${flights.return.flightNumber}`,
      `  origin: ${flights.return.origin}`,
      `  destination: ${flights.return.destination}`,
      `  departureTime: ${flights.return.departureTime}`,
      `  price: ${flights.return.price}`,
      `  currency: ${flights.return.currency}`
    );
  }

  return lines.join('\n');
};

/** Renders the current flight/hotel selection state as a YAML-like block for the system prompt. */
export const buildBookingContext = (state: GraphStateType): string =>
  [
    '## Current Booking State',
    'The following booking state is the current source of truth maintained by the application.',
    '',
    'booking_state:',
    `destination: ${yamlValue(state.destination)}`,
    `startDate: ${yamlValue(state.startDate)}`,
    `endDate: ${yamlValue(state.endDate)}`,
    `travelers: ${yamlValue(state.travelers)}`,
    '',
    `hotelSelectionStatus: ${yamlValue(state.hotelSelectionStatus)}`,
    describeHotel(state.hotel),
    '',
    `flightSelectionStatus: ${yamlValue(state.flightSelectionStatus)}`,
    describeFlights(state.flights),
  ].join('\n');
