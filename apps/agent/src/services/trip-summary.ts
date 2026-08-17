import { z } from 'zod';

// Schemas
import { TripCostEstimateSchema, TripSummaryInputSchema, TripSummaryResultSchema } from '@/schemas';

// Services
import { searchFlights } from './flights';
import { searchHotels } from './hotel';
import { getRoute } from './route';

// Infrastructure
import { getOpenAIClient, OPENAI_CLIENT_MODEL } from '@/infrastructure/llm';

// Utils
import { daysBetween, todayIso } from '@/utils/date';

type DailyRates = { food: number; activities: number; transport: number };

const DailyRatesSchema = z.object({
  food: z.number(),
  activities: z.number(),
  transport: z.number(),
});

const FALLBACK_RATES: DailyRates = { food: 35, activities: 40, transport: 12 };

/** Estimates daily trip costs, falling back to fixed rates on failure. */
const estimateDailyCosts = async (destination: string): Promise<DailyRates> => {
  try {
    const response = await getOpenAIClient().responses.create({
      model: OPENAI_CLIENT_MODEL,
      input: `Estimate typical daily travel costs in USD for a tourist in ${destination}.`,
      text: {
        format: {
          type: 'json_schema',
          name: 'daily_rates',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              food: { type: 'number', description: 'Daily food cost per person' },
              activities: { type: 'number', description: 'Daily activities & entrance fees' },
              transport: { type: 'number', description: 'Daily local transport' },
            },
            required: ['food', 'activities', 'transport'],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = DailyRatesSchema.safeParse(JSON.parse(response.output_text));

    return parsed.success ? parsed.data : FALLBACK_RATES;
  } catch {
    return FALLBACK_RATES;
  }
};

type TripSummaryToolOutput = z.infer<typeof TripSummaryResultSchema>;

/** Builds a trip summary from parallel flight, hotel, route, and cost lookups. */
export const getTripSummary = async (
  input: z.infer<typeof TripSummaryInputSchema>
): Promise<TripSummaryToolOutput> => {
  const {
    destination,
    startDate,
    endDate,
    travelers = 1,
    flightOrigin,
    skipFlights = false,
    skipHotel = false,
  } = input;

  const today = todayIso();
  const resolvedStart = startDate ?? today;
  const resolvedEnd = endDate ?? today;
  const days = !startDate && !endDate ? 1 : daysBetween(resolvedStart, resolvedEnd);

  if (days < 1) {
    throw new Error(`endDate (${resolvedEnd}) must be after startDate (${resolvedStart})`);
  }

  const [flightResult, hotelResult, routeResult] = await Promise.allSettled([
    !skipFlights && flightOrigin
      ? searchFlights({
          origin: flightOrigin,
          destination,
          departure_date: resolvedStart,
          adults: travelers,
          sort: 'price_asc',
        })
      : Promise.resolve(null),
    !skipHotel
      ? searchHotels({
          city: destination,
          checkIn: resolvedStart,
          checkOut: resolvedEnd,
          adults: travelers,
          availableOnly: true,
        })
      : Promise.resolve(null),
    getRoute({ city: destination, maxStops: Math.min(days + 2, 8) }),
  ]);

  const flights = flightResult.status === 'fulfilled' ? flightResult.value : null;
  const hotels = hotelResult.status === 'fulfilled' ? hotelResult.value : null;
  const route = routeResult.status === 'fulfilled' ? routeResult.value : null;

  const suggestedFlight = flights?.results?.length
    ? flights.results.reduce((best, f) => (f.price < best.price ? f : best))
    : null;

  const suggestedHotel =
    hotels?.results?.filter((h) => h.available).sort((a, b) => b.rating - a.rating)[0] ?? null;

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

  const parsed = TripSummaryResultSchema.safeParse({
    destination,
    startDate: resolvedStart,
    endDate: resolvedEnd,
    travelers,
    days,
    suggestedFlight,
    suggestedHotel,
    route,
    costEstimate,
  });

  if (!parsed.success) {
    throw new Error(`Failed to build trip summary: ${parsed.error.message}`);
  }

  return parsed.data;
};
