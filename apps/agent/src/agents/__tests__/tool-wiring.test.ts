import { describe, expect, it } from 'vitest';

import {
  CANCEL_BOOKING_AGENT_TOOLS,
  EXPLORE_AGENT_TOOLS,
  FLIGHT_BOOKING_AGENT_TOOLS,
  GENERAL_AGENT_TOOLS,
  HOTEL_BOOKING_AGENT_TOOLS,
  PLANNING_AGENT_TOOLS,
} from '..';

const nameOf = (tools: { name: string }[]) => tools.map((tool) => tool.name).sort();

describe('specialized agent tool wiring', () => {
  it('binds discovery tools to explore and multi-domain search tools to planning', () => {
    expect(nameOf(EXPLORE_AGENT_TOOLS)).toEqual(
      ['destinationExplorerTool', 'knowledgeSearchTool', 'localTipsTool', 'placesTool'].sort()
    );
    expect(nameOf(PLANNING_AGENT_TOOLS)).toEqual(
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
    expect(nameOf(FLIGHT_BOOKING_AGENT_TOOLS)).toEqual(['bookFlightTool']);
    expect(nameOf(HOTEL_BOOKING_AGENT_TOOLS)).toEqual(['bookHotelTool']);
    expect(nameOf(CANCEL_BOOKING_AGENT_TOOLS)).toEqual(['cancelBookingTool']);
    expect(GENERAL_AGENT_TOOLS).toEqual([]);

    const allNamedTools = [
      ...EXPLORE_AGENT_TOOLS,
      ...PLANNING_AGENT_TOOLS,
      ...FLIGHT_BOOKING_AGENT_TOOLS,
      ...HOTEL_BOOKING_AGENT_TOOLS,
      ...CANCEL_BOOKING_AGENT_TOOLS,
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
