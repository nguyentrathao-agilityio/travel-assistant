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

export const WRITE_TOOL_NAMES: ReadonlySet<string> = new Set([
  TOOL_NAMES.BOOK_FLIGHT,
  TOOL_NAMES.BOOK_HOTEL,
  TOOL_NAMES.CANCEL_BOOKING,
]);
