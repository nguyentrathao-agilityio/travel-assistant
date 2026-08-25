import { useComponent } from '@copilotkit/react-core/v2';
import { z } from 'zod';
import { DestinationIdeaCard } from '@/components';

const destinationIdeaParameters = z.object({
  destination: z.string().describe('The destination the idea recommends.'),
  headline: z.string().describe('A concise, appealing title for the trip.'),
  description: z.string().describe('A short explanation of why this destination fits the request.'),
  suggestedDays: z.number().int().min(1).max(14).describe('Recommended trip length in days.'),
  bestFor: z.string().optional().describe('Who this trip is especially good for.'),
});

/** Registers a render-only UI tool for destination inspiration. */
export const useTravelIdeaComponent = () => {
  useComponent(
    {
      name: 'showDestinationIdea',
      description:
        'Show a destination idea card in chat when recommending a travel destination. Use only for general inspiration; do not use it for flight, hotel, booking, or search results.',
      parameters: destinationIdeaParameters,
      render: DestinationIdeaCard,
    },
    []
  );
};
