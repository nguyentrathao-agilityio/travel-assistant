import type { ToolMessage } from '@langchain/core/messages';
import type { z } from 'zod';

// Constants
import { TOOL_NAMES } from '@/constants';

// Schemas
import {
  DestinationExplorerResultSchema,
  FlightSearchResultSchema,
  HotelSearchResultSchema,
  PlacesSearchResultSchema,
  RouteResultSchema,
  TipsResultSchema,
  TripSummaryResultSchema,
  WeatherResultSchema,
} from '@/schemas';

// State
import type { SearchResults } from '@/state';

type SearchResultUpdate = Partial<SearchResults>;
type ArtifactParser = (artifact: unknown) => SearchResultUpdate | undefined;

const createArtifactParser =
  <TSchema extends z.ZodTypeAny>(
    schema: TSchema,
    toUpdate: (result: z.infer<TSchema>) => SearchResultUpdate
  ): ArtifactParser =>
  (artifact) => {
    const parsed = schema.safeParse(artifact);

    return parsed.success ? toUpdate(parsed.data) : undefined;
  };

const SEARCH_ARTIFACT_PARSERS = {
  [TOOL_NAMES.WEATHER]: createArtifactParser(WeatherResultSchema, (weather) => ({ weather })),
  [TOOL_NAMES.FLIGHTS]: createArtifactParser(FlightSearchResultSchema, (flights) => ({ flights })),
  [TOOL_NAMES.HOTEL]: createArtifactParser(HotelSearchResultSchema, (hotels) => ({ hotels })),
  [TOOL_NAMES.PLACES]: createArtifactParser(PlacesSearchResultSchema, (places) => ({ places })),
  [TOOL_NAMES.ROUTE]: createArtifactParser(RouteResultSchema, (route) => ({ route })),
  [TOOL_NAMES.LOCAL_TIPS]: createArtifactParser(TipsResultSchema, (localTips) => ({ localTips })),
  [TOOL_NAMES.DESTINATION_EXPLORER]: createArtifactParser(
    DestinationExplorerResultSchema,
    ({ weather, places, tips }) => ({
      ...(weather ? { weather } : {}),
      ...(places ? { places } : {}),
      ...(tips ? { localTips: tips } : {}),
    })
  ),
  [TOOL_NAMES.TRIP_SUMMARY]: createArtifactParser(TripSummaryResultSchema, ({ route }) =>
    route ? { route } : {}
  ),
} satisfies Record<string, ArtifactParser>;

type SearchArtifactToolName = keyof typeof SEARCH_ARTIFACT_PARSERS;

const isSearchArtifactToolName = (name: string | undefined): name is SearchArtifactToolName =>
  name !== undefined && Object.hasOwn(SEARCH_ARTIFACT_PARSERS, name);

/** Adds a validated rich-UI artifact to its structured search-result field. */
export const parseSearchArtifact = (
  message: ToolMessage,
  searchResults: Partial<SearchResults>
): void => {
  const { artifact, name } = message;

  if (artifact === undefined || message.status === 'error' || !isSearchArtifactToolName(name))
    return;

  const update = SEARCH_ARTIFACT_PARSERS[name](artifact);

  if (update) Object.assign(searchResults, update);
};
