import { describe, expect, it } from 'vitest';

// Constants
import { AGENT_CONFIGS } from '@/constants/agent-config';

// Utils
import { isBookingToolName } from '@/utils/tool';

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
    expect(nameOf(AGENT_CONFIGS.explore.tools)).toEqual(
      ['destinationExplorerTool', 'knowledgeSearchTool', 'localTipsTool', 'placesTool'].sort()
    );
    expect(nameOf(AGENT_CONFIGS.plan.tools)).toEqual(
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
    expect(nameOf(AGENT_CONFIGS.booking.tools)).toEqual(
      ['bookFlightTool', 'bookHotelTool', 'cancelBookingTool'].sort()
    );
    expect(AGENT_CONFIGS.booking.approvalTools).toEqual([
      'bookFlightTool',
      'bookHotelTool',
      'cancelBookingTool',
    ]);
    expect(AGENT_CONFIGS.general.tools).toEqual([]);

    const allNamedTools = [
      ...AGENT_CONFIGS.explore.tools,
      ...AGENT_CONFIGS.plan.tools,
      ...AGENT_CONFIGS.booking.tools,
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

  it('identifies only booking write tools from the shared registry', () => {
    expect(isBookingToolName('bookFlightTool')).toBe(true);
    expect(isBookingToolName('bookHotelTool')).toBe(true);
    expect(isBookingToolName('cancelBookingTool')).toBe(true);
    expect(isBookingToolName('flightsTool')).toBe(false);
  });
});
