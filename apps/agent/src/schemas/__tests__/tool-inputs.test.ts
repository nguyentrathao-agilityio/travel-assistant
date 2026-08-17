import { describe, expect, it } from 'vitest';

import { FlightInputSchema } from '@/schemas/flights';
import { HotelInputSchema } from '@/schemas/hotel';
import { PlacesInputSchema } from '@/schemas/places';
import { TipsInputSchema } from '@/schemas/tips';

describe('standardized tool inputs', () => {
  it('normalizes valid IATA codes and rejects arbitrary locations', () => {
    const valid = FlightInputSchema.parse({
      origin: 'dad',
      destination: 'sgn',
      departure_date: '2099-01-01',
    });

    expect(valid.origin).toBe('DAD');
    expect(FlightInputSchema.safeParse({ ...valid, origin: 'Da Nang' }).success).toBe(false);
  });

  it('uses a valid hotel guest default', () => {
    const result = HotelInputSchema.parse({
      city: 'Da Nang',
      checkIn: '2099-01-01',
      checkOut: '2099-01-02',
    });

    expect(result.adults).toBe(2);
  });

  it('requires destination scope for places and local tips', () => {
    expect(PlacesInputSchema.safeParse({}).success).toBe(false);
    expect(TipsInputSchema.safeParse({ city: 'Da Nang' }).success).toBe(false);
    expect(TipsInputSchema.safeParse({ city: 'Da Nang', country: 'Vietnam' }).success).toBe(true);
  });

  it('validates places filters and pagination bounds', () => {
    expect(PlacesInputSchema.safeParse({ city: 'Hanoi', min_rating: 6 }).success).toBe(false);
    expect(PlacesInputSchema.safeParse({ city: 'Hanoi', limit: 0 }).success).toBe(false);
  });
});
