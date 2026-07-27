import type { Intent } from '../schemas/intent';

export const CLASSIFY_SYSTEM_PROMPT = `Classify the user's latest travel-related message into exactly one category:
- explore: discovering destinations, attractions, places, or local tips — no specific booking action.
- plan: searching flights, hotels, routes, weather, or a full itinerary — not yet booking.
- book_flight: the user wants to book, confirm, or purchase a specific flight.
- book_hotel: the user wants to book, confirm, or purchase a specific hotel.
- cancel_booking: the user wants to cancel or change an existing booking.
- general: greetings, small talk, or anything that doesn't fit the categories above.

Respond with only the category.`;

export const FALLBACK_INTENT: Intent = 'general';

export const MAX_CLASSIFY_MESSAGES = 4;
