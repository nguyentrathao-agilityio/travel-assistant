import { describe, expect, it } from 'vitest';

import { flightsTool } from '../flights';
import { hotelTool } from '../hotel';
import { placesTool } from '../places';
import { weatherTool } from '../weather';
import { routeTool } from '../route';
import { tipsTool } from '../tips';
import { tripSummaryTool } from '../trip-summary';
import { destinationExplorerTool } from '../destination-explorer';
import { bookFlightTool, bookHotelTool, cancelBookingTool } from '../booking';

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
