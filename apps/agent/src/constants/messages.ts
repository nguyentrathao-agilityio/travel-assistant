export const TOOL_ERROR_MESSAGES = {
  WEATHER:
    "Weather data isn't available for that location right now. Please try again in a moment.",
  FLIGHTS: "I couldn't search flights right now. Please try again or adjust your dates.",
  HOTELS: 'Hotel search failed. Try different dates or another city.',
  FLIGHT_BOOKING: "I couldn't complete the flight booking. Please review it and try again.",
  HOTEL_BOOKING: "I couldn't complete the hotel booking. Please review it and try again.",
  BOOKING_CANCEL: "I couldn't cancel that booking. Please try again.",
  PLACES: "Couldn't load places for that destination. Please try again.",
  ROUTE: "Couldn't build a route for that city. Please try again.",
  LOCAL_TIPS: 'Local tips are unavailable right now. Please try again.',
  TRIP_SUMMARY: 'Trip summary failed. Try asking me to search flights and hotels separately.',
  DESTINATION_EXPLORER:
    'Destination explorer failed. Try searching places, tips, or weather separately.',
  MEMORY: "Couldn't access remembered preferences right now.",
} as const;

export const ERROR_MESSAGES = {
  NO_API_URL: 'API_URL environment variable is not set',
  SEARCH_FAILED: (status: number, statusText: string) =>
    `Flight search failed: ${status} ${statusText}`,
  INVALID_RESPONSE: 'Invalid flight search response shape',
  UNKNOWN: 'An unexpected error occurred during flight search',
} as const;
