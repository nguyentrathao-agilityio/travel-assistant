import {
  BOOKING_AGENT_TOOLS,
  EXPLORE_AGENT_TOOLS,
  GENERAL_AGENT_TOOLS,
  PLANNING_AGENT_TOOLS,
} from '..';
import { describe, expect, it } from 'vitest';

// Constants
import { isBookingToolName } from '@/constants';
import { AGENT_CONFIGS } from '@/constants/agent-config';

const nameOf = (tools: { name: string }[]) => tools.map((tool) => tool.name).sort();

describe('specialized agent tool wiring', () => {
  it('keeps every domain agent in one typed configuration registry', () => {
    expect(Object.keys(AGENT_CONFIGS).sort()).toEqual(
      ['explore', 'plan', 'booking', 'general'].sort()
    );
    for (const [name, config] of Object.entries(AGENT_CONFIGS)) {
      expect(config.name).toBe(name);
      expect(config.prompt.toolsSection).toBeTruthy();
    }
  });

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
    expect(nameOf(BOOKING_AGENT_TOOLS)).toEqual(
      ['bookFlightTool', 'bookHotelTool', 'cancelBookingTool'].sort()
    );
    expect(AGENT_CONFIGS.booking.approvalTools).toEqual([
      'bookFlightTool',
      'bookHotelTool',
      'cancelBookingTool',
    ]);
    expect(GENERAL_AGENT_TOOLS).toEqual([]);

    const allNamedTools = [...EXPLORE_AGENT_TOOLS, ...PLANNING_AGENT_TOOLS, ...BOOKING_AGENT_TOOLS];
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

  it('identifies only booking write tools from the shared registry', () => {
    expect(isBookingToolName('bookFlightTool')).toBe(true);
    expect(isBookingToolName('bookHotelTool')).toBe(true);
    expect(isBookingToolName('cancelBookingTool')).toBe(true);
    expect(isBookingToolName('flightsTool')).toBe(false);
  });
});
