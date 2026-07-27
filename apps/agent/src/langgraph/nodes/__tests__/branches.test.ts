import { describe, expect, it } from 'vitest';

import {
  BOOK_FLIGHT_TOOLS,
  BOOK_HOTEL_TOOLS,
  CANCEL_BOOKING_TOOLS,
  EXPLORE_TOOLS,
  GENERAL_TOOLS,
  PLAN_TOOLS,
} from '../branches';

const nameOf = (tools: { name: string }[]) => tools.map((t) => t.name).sort();

describe('branch tool wiring', () => {
  it('binds each branch to exactly its own tools, with no cross-branch leakage', () => {
    expect(nameOf(EXPLORE_TOOLS)).toEqual(
      ['destinationExplorerTool', 'localTipsTool', 'placesTool'].sort()
    );
    expect(nameOf(PLAN_TOOLS)).toEqual(
      ['flightsTool', 'hotelTool', 'routeTool', 'tripSummaryTool', 'weatherTool'].sort()
    );
    expect(nameOf(BOOK_FLIGHT_TOOLS)).toEqual(['bookFlightTool']);
    expect(nameOf(BOOK_HOTEL_TOOLS)).toEqual(['bookHotelTool']);
    expect(nameOf(CANCEL_BOOKING_TOOLS)).toEqual(['cancelBookingTool']);
    expect(GENERAL_TOOLS).toEqual([]);

    const allNamedTools = [
      ...EXPLORE_TOOLS,
      ...PLAN_TOOLS,
      ...BOOK_FLIGHT_TOOLS,
      ...BOOK_HOTEL_TOOLS,
      ...CANCEL_BOOKING_TOOLS,
    ];
    const uniqueNames = new Set(allNamedTools.map((t) => t.name));
    expect(uniqueNames.size).toBe(allNamedTools.length);
  });
});
