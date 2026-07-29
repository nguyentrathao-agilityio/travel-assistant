export const buildMemoryContext = (memories: string[]): string | null => {
  if (memories.length === 0) return null;

  return [
    '## Remembered Preferences',
    'These facts were remembered from earlier conversations — treat them as already known.',
    'Use a matching fact to fill an argument the user hasn’t stated yet, without asking them',
    'to restate it. Anything the user states in the current request always overrides these.',
    '',
    ...memories.map((memory) => `- ${memory}`),
  ].join('\n');
};
