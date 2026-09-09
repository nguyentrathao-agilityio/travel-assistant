export const toMapsUrl = (lat?: number, lng?: number): string | null => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};
