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

export const BOOKING_TOOL_NAMES = [
  TOOL_NAMES.BOOK_FLIGHT,
  TOOL_NAMES.BOOK_HOTEL,
  TOOL_NAMES.CANCEL_BOOKING,
] as const;

export const WRITE_TOOL_NAMES: ReadonlySet<string> = new Set(BOOKING_TOOL_NAMES);
