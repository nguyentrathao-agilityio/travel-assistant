import { ToolMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';

// State
import type { SearchResults } from '@/state';

// Agent middleware
import { parseSearchArtifact } from '@/agent/middleware/domain-state/search-artifacts';

const toolResult = (name: string, artifact: unknown, status?: 'success' | 'error') =>
  new ToolMessage({
    name,
    content: JSON.stringify(artifact),
    artifact,
    status,
    tool_call_id: `call-${name}`,
  });

describe('parseSearchArtifact', () => {
  it('stores a validated artifact in the matching result field', () => {
    const results: Partial<SearchResults> = {};
    const weather = {
      location: {
        name: 'Da Nang',
        country: 'Vietnam',
        latitude: 16.05,
        longitude: 108.2,
      },
      current: {
        time: '2026-08-05T12:00:00+07:00',
        temperatureC: 30,
        apparentTemperatureC: 33,
        relativeHumidity: 70,
        windSpeedKmh: 8,
        description: 'Sunny',
      },
      daily: [],
      travelTip: 'Wear sunscreen.',
    };

    parseSearchArtifact(toolResult('weatherTool', weather), results);

    expect(results).toEqual({ weather });
  });

  it('ignores unknown tools, invalid artifacts, and failed messages', () => {
    const results: Partial<SearchResults> = {};

    parseSearchArtifact(toolResult('unknownTool', { value: true }), results);
    parseSearchArtifact(toolResult('weatherTool', { unexpected: true }), results);
    parseSearchArtifact(toolResult('weatherTool', {}, 'error'), results);

    expect(results).toEqual({});
  });
});
