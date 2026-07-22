import type { GraphStateType } from '../state';
import { SYSTEM_PROMPT } from '../constants';
import { todayIso } from './date';

const BOOKING_STATE_RULES = `Rules:
- Treat every non-null value as already confirmed by the user.
- Never ask the user to confirm a value that already exists in this state.
- Never search again for flights or hotels that already exist here unless the user explicitly asks to change them.
- If a required value is null, ask exactly one clarifying question before calling a tool.
- Use this state together with the conversation history to determine the next action.`;

const yamlValue = (value: string | number | undefined): string =>
  value === undefined || value === '' ? 'null' : String(value);

const describeHotel = (hotel: GraphStateType['hotel']): string => {
  if (!hotel) return 'hotel: null';
  return ['hotel:', `  name: ${hotel.name}`, `  city: ${hotel.city}`].join('\n');
};

const describeFlights = (flights: GraphStateType['flights']): string => {
  if (!flights?.departure && !flights?.return) return 'flights: null';

  const lines = ['flights:'];
  if (flights.departure) {
    lines.push(
      'departure:',
      `airline: ${flights.departure.airline.name}`,
      `flightNumber: ${flights.departure.flightNumber}`
    );
  }
  if (flights.return) {
    lines.push(
      'return:',
      `airline: ${flights.return.airline.name}`,
      `flightNumber: ${flights.return.flightNumber}`
    );
  }

  return lines.join('\n');
};

/**
 * Appends a "Current Booking State" block to the system prompt so the model
 * can avoid re-searching already-confirmed flights/hotels and avoid guessing
 * a destination/dates for itinerary-shaped tools. bookingState is written
 * only by the frontend (via useCoAgent) — this is a read-only summary.
 */
export const buildSystemPrompt = (state: GraphStateType): string => {
  const bookingState = [
    'booking_state:',
    `destination: ${yamlValue(state.destination)}`,
    `startDate: ${yamlValue(state.startDate)}`,
    `endDate: ${yamlValue(state.endDate)}`,
    `travelers: ${yamlValue(state.travelers)}`,
    '',
    describeHotel(state.hotel),
    '',
    describeFlights(state.flights),
  ].join('\n');

  const bookingStateSection = [
    '## Current Booking State',
    'The following booking state is the current source of truth maintained by the application.',
    BOOKING_STATE_RULES,
    bookingState,
  ].join('\n\n');

  const today = state.clientDate ?? todayIso();
  const clientDateSection = [
    '## Client Date & Timezone',
    `today: ${today} ← always use this value for "today" / "tonight" / relative dates; never guess a date`,
    ...(state.clientTimezone ? [`timezone: ${state.clientTimezone}`] : []),
  ].join('\n');

  return [SYSTEM_PROMPT, bookingStateSection, clientDateSection].join('\n\n');
};
