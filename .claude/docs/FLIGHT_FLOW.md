# Flight Search Flow

```
User typing with Copilot
    │
    ▼ POST /api/chat
[mastra/index.ts] registerCopilotKit()
  setContext: inject date/timezone/TripState vào requestContext
    │
    ▼
[agents/travel-agent.ts] travelAgent (GPT-4o-mini)
  tools: flightsTool, hotelTool, weatherTool, ...
    │  agent pick flightsTool
    ▼
[tools/flights-tool.ts] flightsTool
  inputSchema: FlightInputSchema (origin, destination, departure_date, ...)
  execute() →
    │
    ▼
[services/flightsService.ts] searchFlights()
  fetch: GET {API_URL}/flights/search?...
  validate: ApiFlightSearchResponseSchema.safeParse()
  return: FlightSearchResult
    │
    ▼
[hooks/useFlightAction.tsx] useRenderToolCall({ name: 'flightsTool' })
  status=inProgress → <ToolLoading />
  status=complete   →
    │
    ▼
[components/FlightCard/index.tsx] <FlightCard />

          │
          ▼
[hooks/useTripState.tsx] selectFlight(flight, 'departure'|'return')
  useCoAgent setState → sync TripState to agent
  useTripStateStore   → persist localStorage
```
