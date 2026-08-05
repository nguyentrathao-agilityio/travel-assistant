import type { Intent } from '../schemas/intent';

export const CLASSIFY_SYSTEM_PROMPT = `Analyze the user's latest message. Return a structured intent classification and only reusable travel fields supported by the schema.

Also return requiredOperations for every read operation explicitly requested in the latest message:
weather, flights, hotels, places, route, tripSummary, or knowledge. Return [] when none apply.
For a multi-part request include every requested operation; do not mark booking writes as read operations.

Intent categories:
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
  must search first. A weather/flights/hotels/places/route request is still plan even when it
  names no destination (for example "what's the weather today?") — the plan agent asks for the
  missing city itself; do not fall back to general just because a field is missing.
- book_flight: the user wants to book, confirm, or purchase a flight that is already identified —
  by an exact flight ID, or by clear reference to one already shown earlier in this conversation.
- book_hotel: the user wants to book, confirm, or purchase a hotel that is already identified — by
  an exact hotel ID, or by clear reference to one already shown earlier in this conversation.
- cancel_booking: the user wants to cancel or change an existing confirmed booking. Changing
  search criteria, dates, destination, or an unbooked selection is plan instead.
- general: greetings, small talk, or anything that doesn't fit the categories above.

Rules:
- Classify only. Do not answer the user, call tools, search, plan, book, or cancel anything.
- Use the supplied known state and recent messages to resolve follow-ups such as "the second one",
  "how about Hoi An?", or "change the date".
- Extract a field when the latest message supplies or clearly changes it. Return null for every
  field not supplied or changed by the latest message; null fields are removed before the state
  update so previously known values are preserved by state reducers.
- Resolve relative dates to YYYY-MM-DD using clientDate when it is available. If a date cannot be
  resolved reliably, return null rather than inventing it.
- A reference to an exact or previously selected flight/hotel can be a booking intent. An ambiguous
  booking reference with no matching state must route to plan or general, never destructive booking.
- Use general with low confidence when no category is reliable.`;

export const FALLBACK_INTENT: Intent = 'general';

export const MAX_CLASSIFY_MESSAGES = 4;
