export const STATE_KEYS = [
  'flights',
  'hotel',
  'destination',
  'startDate',
  'endDate',
  'travelers',
] as const;

export type StateKey = (typeof STATE_KEYS)[number];

export const VALUE_KEYS = new Set<StateKey>([
  'destination',
  'startDate',
  'endDate',
  'travelers',
  'hotel',
]);
