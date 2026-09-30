import { describe, expect, it } from 'vitest';

import { FlightBookingInputSchema, HotelBookingInputSchema } from '@/schemas/booking';

type FieldShape = Record<string, { description?: string }>;

// Unwraps preprocess/refine wrappers down to the object schema.
const shapeOf = (schema: unknown): FieldShape => {
  let current = schema as { _def: { schema?: unknown }; shape?: FieldShape };

  while (!current.shape && current._def.schema) current = current._def.schema as typeof current;

  return current.shape ?? {};
};

describe('booking id descriptions', () => {
  it('tells the model to pass the result id, never the hotel code', () => {
    expect(shapeOf(HotelBookingInputSchema).hotelId?.description).toMatch(/`id`.*never.*code/i);
    expect(shapeOf(FlightBookingInputSchema).flightId?.description).toMatch(/`id`/);
  });
});
