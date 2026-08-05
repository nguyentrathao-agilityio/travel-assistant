import { describe, expect, it } from 'vitest';

import { IntentClassificationSchema, IntentSchema } from '@/schemas/intent';

describe('IntentSchema', () => {
  it('accepts every known intent value', () => {
    const values = ['explore', 'plan', 'book_flight', 'book_hotel', 'cancel_booking', 'general'];

    for (const value of values) {
      expect(IntentSchema.safeParse(value).success).toBe(true);
    }
  });

  it('rejects unknown values', () => {
    expect(IntentSchema.safeParse('shop').success).toBe(false);
  });
});

describe('IntentClassificationSchema', () => {
  const emptyFields = {
    origin: null,
    destination: null,
    departureDate: null,
    returnDate: null,
    travelers: null,
    budget: null,
  };

  it('requires an intent field matching IntentSchema', () => {
    expect(
      IntentClassificationSchema.safeParse({
        intent: 'plan',
        confidence: 0.9,
        requiredOperations: ['hotels'],
        extractedFields: {
          ...emptyFields,
          destination: 'Da Nang',
          departureDate: '2026-08-14',
        },
      }).success
    ).toBe(true);
    expect(IntentClassificationSchema.safeParse({}).success).toBe(false);
    expect(
      IntentClassificationSchema.safeParse({
        intent: 'shop',
        confidence: 0.9,
        requiredOperations: [],
        extractedFields: emptyFields,
      }).success
    ).toBe(false);
  });

  it('rejects invalid confidence and extracted fields', () => {
    expect(
      IntentClassificationSchema.safeParse({
        intent: 'plan',
        confidence: 2,
        requiredOperations: ['weather'],
        extractedFields: { ...emptyFields, departureDate: 'next Friday', travelers: 0 },
      }).success
    ).toBe(false);
  });

  it('requires every extracted field while accepting null for unavailable values', () => {
    expect(
      IntentClassificationSchema.safeParse({
        intent: 'general',
        confidence: 0.5,
        requiredOperations: [],
        extractedFields: emptyFields,
      }).success
    ).toBe(true);
    expect(
      IntentClassificationSchema.safeParse({
        intent: 'general',
        confidence: 0.5,
        requiredOperations: [],
        extractedFields: { origin: null },
      }).success
    ).toBe(false);
  });

  it('rejects unknown required operations', () => {
    expect(
      IntentClassificationSchema.safeParse({
        intent: 'plan',
        confidence: 0.9,
        requiredOperations: ['payments'],
        extractedFields: emptyFields,
      }).success
    ).toBe(false);
  });
});
