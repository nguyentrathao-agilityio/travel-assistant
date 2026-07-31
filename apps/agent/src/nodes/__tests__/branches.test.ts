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
  it('binds discovery tools to explore and multi-domain search tools to plan', () => {
    expect(nameOf(EXPLORE_TOOLS)).toEqual(
      ['destinationExplorerTool', 'knowledgeSearchTool', 'localTipsTool', 'placesTool'].sort()
    );
    expect(nameOf(PLAN_TOOLS)).toEqual(
      [
        'flightsTool',
        'hotelTool',
        'knowledgeSearchTool',
        'placesTool',
        'routeTool',
        'transferToBookFlightTool',
        'transferToBookHotelTool',
        'tripSummaryTool',
        'weatherTool',
      ].sort()
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
    const occurrences = allNamedTools.reduce<Record<string, number>>((counts, item) => {
      counts[item.name] = (counts[item.name] ?? 0) + 1;
      return counts;
    }, {});
    expect(occurrences).toEqual(
      expect.objectContaining({
        knowledgeSearchTool: 2,
        placesTool: 2,
        bookFlightTool: 1,
        bookHotelTool: 1,
        cancelBookingTool: 1,
      })
    );
  });
});
