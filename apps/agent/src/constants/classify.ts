import type { Intent } from '../schemas/intent';

export const CLASSIFY_SYSTEM_PROMPT = `Classify the user's latest travel-related message into exactly one category:
- explore: discovering destinations, attractions, places, local tips, or trusted travel knowledge.
  Always use explore for visa/entry/immigration, required travel documents, customs, official
  sources, safety/culture/transport guidance, or explicit "knowledge base" questions when the
  user is not asking for a flight, hotel, route, weather, or full itinerary.
- plan: searching flights, hotels, routes, weather, or a full itinerary — not yet booking.
  Use plan when a request combines multiple search domains (for example flights + hotels,
  hotels + places), or when a trip/itinerary request also contains one of the knowledge topics
  above. Also use plan — never book_flight/book_hotel — when the user asks to book/confirm the
  cheapest, best, or "a" flight/hotel by route or city rather than by an exact ID or a flight/hotel
  already shown earlier in this conversation: nothing has been searched or selected yet, so it
  must search first.
- book_flight: the user wants to book, confirm, or purchase a flight that is already identified —
  by an exact flight ID, or by clear reference to one already shown earlier in this conversation.
- book_hotel: the user wants to book, confirm, or purchase a hotel that is already identified — by
  an exact hotel ID, or by clear reference to one already shown earlier in this conversation.
- cancel_booking: the user wants to cancel or change an existing booking.
- general: greetings, small talk, or anything that doesn't fit the categories above.

Respond with only the category.`;

export const FALLBACK_INTENT: Intent = 'general';

export const MAX_CLASSIFY_MESSAGES = 4;
