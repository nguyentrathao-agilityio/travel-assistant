import type { Intent } from '../schemas/intent';

export const CLASSIFY_SYSTEM_PROMPT = `Classify the user's latest travel-related message into exactly one category:
- explore: discovering destinations, attractions, places, local tips, or trusted travel knowledge.
  Always use explore for visa/entry/immigration, required travel documents, customs, official
  sources, safety/culture/transport guidance, or explicit "knowledge base" questions when the
  user is not asking for a flight, hotel, route, weather, or full itinerary.
- plan: searching flights, hotels, routes, weather, or a full itinerary — not yet booking.
  Use plan when a trip/itinerary request also contains one of the knowledge topics above.
- book_flight: the user wants to book, confirm, or purchase a specific flight.
- book_hotel: the user wants to book, confirm, or purchase a specific hotel.
- cancel_booking: the user wants to cancel or change an existing booking.
- general: greetings, small talk, or anything that doesn't fit the categories above.

Respond with only the category.`;

export const FALLBACK_INTENT: Intent = 'general';

export const MAX_CLASSIFY_MESSAGES = 4;
