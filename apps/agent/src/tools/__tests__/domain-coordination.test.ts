import { describe, expect, it } from 'vitest';

// Tools
import { bookFlightTool, bookHotelTool, cancelBookingTool } from '@/tools/booking';
import { destinationExplorerTool } from '@/tools/destination-explorer';
import { flightsTool } from '@/tools/flights';
import { hotelTool } from '@/tools/hotel';
import { placesTool } from '@/tools/places';
import { routeTool } from '@/tools/route';
import { tipsTool } from '@/tools/tips';
import { tripSummaryTool } from '@/tools/trip-summary';
import { weatherTool } from '@/tools/weather';

describe('multi-domain search coordination', () => {
  it.each([
    ['flight', flightsTool],
    ['hotel', hotelTool],
    ['places', placesTool],
  ])('returns the %s result to the coordinator', (_domain, domainTool) => {
    expect(domainTool.returnDirect).toBe(false);
  });

  it.each([
    flightsTool,
    hotelTool,
    placesTool,
    weatherTool,
    routeTool,
    tipsTool,
    tripSummaryTool,
    destinationExplorerTool,
    bookFlightTool,
    bookHotelTool,
    cancelBookingTool,
  ])('separates model content from the $name rich-card artifact', (richUiTool) => {
    expect(richUiTool.responseFormat).toBe('content_and_artifact');
    expect(richUiTool.returnDirect).toBe(false);
  });
});
