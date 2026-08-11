// Exclude remembered destinations that conflict with the current request.
const LOCATION_FACT_KEY_HINTS = ['city', 'destination', 'location', 'airport'];

// Keep origin facts so tools can reuse the traveler's departure location.
const ORIGIN_FACT_KEY_HINTS = ['home', 'departure'];

const keyOf = (memory: string): string | null => {
  const separatorIndex = memory.indexOf(':');
  return separatorIndex === -1 ? null : memory.slice(0, separatorIndex).trim().toLowerCase();
};

const isLocationFact = (memory: string): boolean => {
  const key = keyOf(memory);
  if (key === null) return false;
  if (ORIGIN_FACT_KEY_HINTS.some((hint) => key.includes(hint))) return false;

  return LOCATION_FACT_KEY_HINTS.some((hint) => key.includes(hint));
};

export const buildMemoryContext = (memories: string[]): string | null => {
  const safeMemories = memories.filter((memory) => !isLocationFact(memory));
  if (safeMemories.length === 0) return null;

  return [
    '## Remembered Preferences',
    'These facts were remembered from earlier conversations — treat them as already known.',
    'Use a matching fact to fill an argument the user hasn’t stated yet, without asking them',
    'to restate it. Anything the user states in the current request always overrides these.',
    '',
    ...safeMemories.map((memory) => `- ${memory}`),
  ].join('\n');
};
