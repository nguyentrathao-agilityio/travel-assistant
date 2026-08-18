/** Tool names used by the compiled agent runtime. Keep these aligned with the web contract. */
export const TOOL_NAMES = {
  WEATHER: 'weatherTool',
  FLIGHTS: 'flightsTool',
  HOTEL: 'hotelTool',
  LOCAL_TIPS: 'localTipsTool',
  PLACES: 'placesTool',
  ROUTE: 'routeTool',
  TRIP_SUMMARY: 'tripSummaryTool',
  DESTINATION_EXPLORER: 'destinationExplorerTool',
  KNOWLEDGE_SEARCH: 'knowledgeSearchTool',
  BOOK_FLIGHT: 'bookFlightTool',
  BOOK_HOTEL: 'bookHotelTool',
  CANCEL_BOOKING: 'cancelBookingTool',
} as const;

export const TOOL_PROVIDERS = {
  TRAVEL_API: 'travel-api',
} as const;

export const TOOL_RESPONSE_FORMAT = {
  CONTENT_AND_ARTIFACT: 'content_and_artifact',
} as const;

export const BOOKING_TOOL_NAMES = [
  TOOL_NAMES.BOOK_FLIGHT,
  TOOL_NAMES.BOOK_HOTEL,
  TOOL_NAMES.CANCEL_BOOKING,
] as const;

export const WRITE_TOOL_NAMES: ReadonlySet<string> = new Set(BOOKING_TOOL_NAMES);

export const TOOL_TIMEOUT_MS = 15_000;

export const AUTHENTICATION_STATUS_PATTERN = /\b(401|403)\b/;
export const RATE_LIMIT_STATUS_PATTERN = /\b429\b/;
export const SERVER_ERROR_STATUS_PATTERN = /\b5\d\d\b/;
