import { createWorkflow, createStep } from '@mastra/core/workflows';

// Services
import { searchFlights, getRoute, searchHotels } from '@/services';

// Schemas
import { TripSummaryResultSchema, TripCostEstimateSchema } from '@repo/schemas';
import { FetchedDataSchema, TripSummaryInputSchema, ValidatedInputSchema } from '@/schemas';

// Utils
import { estimateDailyCosts, daysBetween, todayIso, AppError, APP_ERROR_CODE } from '@/utils';

// ─── Step 1 — Validate & normalize input ──────────────────────────────────
const validateInputStep = createStep({
  id: 'validate-input',
  description: 'Normalize dates, compute trip duration, and set defaults',
  inputSchema: TripSummaryInputSchema,
  outputSchema: ValidatedInputSchema,
  execute: async ({ inputData }) => {
    const {
      destination,
      startDate,
      endDate,
      travelers = 1,
      flightOrigin,
      skipFlights = false,
      skipHotel = false,
    } = inputData;

    const today = todayIso();
    const resolvedStart = startDate ?? today;
    const resolvedEnd = endDate ?? today;

    const days = !startDate && !endDate ? 1 : daysBetween(resolvedStart, resolvedEnd);
    if (days < 1) {
      throw new AppError(
        APP_ERROR_CODE.API,
        `endDate (${resolvedEnd}) must be after startDate (${resolvedStart})`
      );
    }

    return {
      destination,
      startDate: resolvedStart,
      endDate: resolvedEnd,
      travelers,
      days,
      flightOrigin,
      skipFlights,
      skipHotel,
    };
  },
});

// ─── Step 2 — Fetch all data in parallel ──────────────────────────────────
const fetchAllDataStep = createStep({
  id: 'fetch-all-data',
  description: 'Fetch flights, hotel, and route in parallel',
  inputSchema: ValidatedInputSchema,
  outputSchema: FetchedDataSchema,
  execute: async ({ inputData }) => {
    const {
      destination,
      startDate,
      endDate,
      travelers,
      days,
      flightOrigin,
      skipFlights,
      skipHotel,
    } = inputData;

    const [flightResult, hotelResult, routeResult] = await Promise.allSettled([
      // Flights — only search if not already booked and origin is provided
      !skipFlights && flightOrigin
        ? searchFlights({
            origin: flightOrigin,
            destination,
            departure_date: startDate,
            adults: travelers,
            sort: 'price_asc',
          })
        : Promise.resolve(null),

      // Hotel — only search if not already booked
      !skipHotel
        ? searchHotels({
            city: destination,
            checkIn: startDate,
            checkOut: endDate,
            adults: travelers,
            availableOnly: true,
          })
        : Promise.resolve(null),

      // Route — stops proportional to trip length (capped at 8)
      getRoute({ city: destination, maxStops: Math.min(days + 2, 8) }),
    ]);

    return {
      destination,
      startDate,
      endDate,
      travelers,
      days,
      flightResult: flightResult.status === 'fulfilled' ? flightResult.value : null,
      hotelResult: hotelResult.status === 'fulfilled' ? (hotelResult.value ?? null) : null,
      routeResult: routeResult.status === 'fulfilled' ? routeResult.value : null,
    };
  },
});

// ─── Step 3 — Build unified summary with cost estimate ────────────────────
const buildTripSummaryStep = createStep({
  id: 'build-trip-summary',
  description: 'Pick best options and compute full cost estimate',
  inputSchema: FetchedDataSchema,
  outputSchema: TripSummaryResultSchema,
  execute: async ({ inputData }) => {
    const {
      destination,
      startDate,
      endDate,
      travelers,
      days,
      flightResult,
      hotelResult,
      routeResult,
    } = inputData;

    // Pick cheapest available flight
    const suggestedFlight = flightResult?.results?.length
      ? flightResult.results.reduce((best, f) => (f.price < best.price ? f : best))
      : null;

    // Pick highest-rated available hotel
    const suggestedHotel =
      hotelResult?.results?.filter((h) => h.available).sort((a, b) => b.rating - a.rating)[0] ??
      null;

    // ── Cost estimate ────────────────────────────────────────────────────
    const currency = suggestedFlight?.currency ?? suggestedHotel?.currency ?? 'USD';

    const flightTotal = suggestedFlight ? suggestedFlight.price * travelers : 0;
    const hotelTotal = suggestedHotel ? suggestedHotel.pricePerNight * days : 0;

    const rates = await estimateDailyCosts(destination);
    const foodTotal = rates.food * days * travelers;
    const activitiesTotal = rates.activities * days;
    const localTransportTotal = rates.transport * days;
    const grandTotal = flightTotal + hotelTotal + foodTotal + activitiesTotal + localTransportTotal;

    const costEstimate = TripCostEstimateSchema.parse({
      flightTotal,
      hotelTotal,
      foodTotal,
      activitiesTotal,
      localTransportTotal,
      grandTotal,
      currency,
      days,
      travelers,
      breakdown: [
        ...(flightTotal > 0
          ? [
              {
                label: 'Flights',
                amount: flightTotal,
                currency,
                note: `${travelers} x $${suggestedFlight?.price}`,
              },
            ]
          : []),
        ...(hotelTotal > 0
          ? [
              {
                label: 'Hotel',
                amount: hotelTotal,
                currency,
                note: `${days} night${days !== 1 ? 's' : ''} x $${suggestedHotel?.pricePerNight}/night`,
              },
            ]
          : []),
        { label: 'Food & drinks', amount: foodTotal, currency, note: `~$${rates.food}/person/day` },
        {
          label: 'Activities',
          amount: activitiesTotal,
          currency,
          note: `~$${rates.activities}/day`,
        },
        {
          label: 'Local transport',
          amount: localTransportTotal,
          currency,
          note: `~$${rates.transport}/day`,
        },
      ],
    });

    // ── Parse final result ───────────────────────────────────────────────
    const parsed = TripSummaryResultSchema.safeParse({
      destination,
      startDate,
      endDate,
      travelers,
      days,
      suggestedFlight,
      suggestedHotel,
      route: routeResult,
      costEstimate,
    });

    if (!parsed.success) {
      throw new Error(`Failed to build trip summary: ${parsed.error.message}`);
    }

    return parsed.data;
  },
});

// ─── Workflow ──────────────────────────────────────────────────────────────
// Agent calls tripSummaryTool → this workflow runs 3 sequential steps:
//   Step 1 — validate-input   : normalize dates, compute days, set defaults
//   Step 2 — fetch-all-data   : flights + hotel + route in parallel
//                               (flights skipped if skipFlights or no flightOrigin)
//                               (hotel skipped if skipHotel)
//   Step 3 — build-trip-summary: cheapest flight, highest-rated hotel, cost estimate
// Result rendered by useTripSummaryAction → TripSummaryCard
export const tripSummaryWorkflow = createWorkflow({
  id: 'trip-summary-workflow',
  description: 'Full trip summary — flights, hotel, route, and cost estimate in one unified result',
  inputSchema: TripSummaryInputSchema,
  outputSchema: TripSummaryResultSchema,
  steps: [validateInputStep, fetchAllDataStep, buildTripSummaryStep],
})
  .then(validateInputStep)
  .then(fetchAllDataStep)
  .then(buildTripSummaryStep)
  .commit();
