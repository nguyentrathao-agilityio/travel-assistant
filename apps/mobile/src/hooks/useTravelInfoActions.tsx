import { z } from 'zod';

import { TOOL_NAMES } from '@repo/constants';
import {
  DestinationExplorerResultSchema,
  PlacesSearchResultSchema,
  RouteResultSchema,
  TipsResultSchema,
  WeatherResultSchema,
} from '@repo/schemas';

import { DestinationExplorerCard } from '../components/DestinationExplorerCard';
import { LocalTipsCard } from '../components/LocalTipsCard';
import { PlacesCard } from '../components/PlacesCard';
import { RouteCard } from '../components/RouteCard';
import { WeatherCard } from '../components/WeatherCard';
import { renderToolResult } from '../components/common/renderToolResult';
import { useRenderToolResult } from './useRenderToolResult';

const weatherParameters = z.object({ city: z.string().optional(), days: z.number().optional() });
const placesParameters = z.object({
  city: z.string().optional(),
  category: z.string().optional(),
  price_level: z.number().optional(),
});
const routeParameters = z.object({ city: z.string().optional(), maxStops: z.number().optional() });
const localTipsParameters = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  essential_only: z.boolean().optional(),
});
const destinationExplorerParameters = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  forecastDays: z.number().optional(),
});

export const useTravelInfoActions = (): void => {
  useRenderToolResult({
    name: TOOL_NAMES.WEATHER,
    schema: weatherParameters,
    render: ({ status, result }) =>
      renderToolResult({
        status,
        result,
        schema: WeatherResultSchema,
        invalidMessage: 'Received an unexpected weather result.',
        render: (data) => <WeatherCard data={data} />,
      }),
  });

  useRenderToolResult({
    name: TOOL_NAMES.PLACES,
    schema: placesParameters,
    render: ({ status, result }) =>
      renderToolResult({
        status,
        result,
        schema: PlacesSearchResultSchema,
        invalidMessage: 'Received an unexpected places result.',
        isEmpty: (data) => data.total === 0,
        emptyMessage: 'No places matched this search.',
        render: (data) => <PlacesCard data={data} />,
      }),
  });

  useRenderToolResult({
    name: TOOL_NAMES.ROUTE,
    schema: routeParameters,
    render: ({ status, result }) =>
      renderToolResult({
        status,
        result,
        schema: RouteResultSchema,
        invalidMessage: 'Received an unexpected route result.',
        isEmpty: (data) => data.stops.length === 0,
        emptyMessage: 'No route stops were available for this destination.',
        render: (data) => <RouteCard data={data} />,
      }),
  });

  useRenderToolResult({
    name: TOOL_NAMES.LOCAL_TIPS,
    schema: localTipsParameters,
    render: ({ status, result }) =>
      renderToolResult({
        status,
        result,
        schema: TipsResultSchema,
        invalidMessage: 'Received an unexpected local tips result.',
        isEmpty: (data) => data.count === 0,
        emptyMessage: 'No local tips were available for this destination.',
        render: (data) => <LocalTipsCard data={data} />,
      }),
  });

  useRenderToolResult({
    name: TOOL_NAMES.DESTINATION_EXPLORER,
    schema: destinationExplorerParameters,
    render: ({ status, result }) =>
      renderToolResult({
        status,
        result,
        schema: DestinationExplorerResultSchema,
        invalidMessage: 'Received an unexpected destination explorer result.',
        render: (data) => <DestinationExplorerCard data={data} />,
      }),
  });
};
