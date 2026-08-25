import { useComponent } from '@copilotkit/react-core/v2';
import { z } from 'zod';
import { PackingChecklistCard } from '@/components';

const packingChecklistParameters = z.object({
  destination: z.string().describe('The trip destination.'),
  tripDays: z.number().int().min(1).max(30).describe('Length of the trip in days.'),
  weatherNote: z.string().describe('A short weather-focused packing note.'),
  items: z
    .array(
      z.object({
        category: z.enum(['clothing', 'documents', 'health', 'electronics', 'other']),
        label: z.string().describe('A concise packing item.'),
        essential: z.boolean().describe('Whether the item is essential for this trip.'),
      })
    )
    .min(1)
    .max(12)
    .describe('A concise, practical packing list.'),
});

/** Registers a render-only checklist for packing advice. */
export const usePackingChecklistComponent = () => {
  useComponent(
    {
      name: 'showPackingChecklist',
      description:
        'Show a packing checklist in chat when the user asks what to pack for a trip. Do not use this for booking, flight, hotel, route, weather-search, or place-search results.',
      parameters: packingChecklistParameters,
      render: PackingChecklistCard,
    },
    []
  );
};
