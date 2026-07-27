import { describe, expect, it } from 'vitest';

import { IntentClassificationSchema, IntentSchema } from '../intent';

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
  it('requires an intent field matching IntentSchema', () => {
    expect(IntentClassificationSchema.safeParse({ intent: 'plan' }).success).toBe(true);
    expect(IntentClassificationSchema.safeParse({}).success).toBe(false);
    expect(IntentClassificationSchema.safeParse({ intent: 'shop' }).success).toBe(false);
  });
});
