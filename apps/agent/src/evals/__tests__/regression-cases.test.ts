import { describe, expect, it } from 'vitest';

import { TRAVEL_REGRESSION_CASES } from '@/evals/regression-cases';

describe('provider-free travel evaluation dataset', () => {
  it('has unique scenario names and non-empty prompts', () => {
    expect(new Set(TRAVEL_REGRESSION_CASES.map(({ name }) => name)).size).toBe(
      TRAVEL_REGRESSION_CASES.length
    );
    expect(TRAVEL_REGRESSION_CASES.every(({ input }) => input.trim().length > 0)).toBe(true);
  });

  it('covers the required regression criteria', () => {
    const criteria = new Set(TRAVEL_REGRESSION_CASES.flatMap((testCase) => testCase.criteria));

    expect(criteria).toEqual(
      new Set([
        'intent_accuracy',
        'required_field_extraction',
        'tool_selection',
        'answer_relevance',
        'grounded_results',
        'no_unsupported_write',
        'approval_required',
        'no_duplicate_ui_content',
      ])
    );
  });

  it('marks every write-intent case as approval protected', () => {
    const writeCases = TRAVEL_REGRESSION_CASES.filter(({ expectedIntent }) =>
      ['book_flight', 'book_hotel', 'cancel_booking'].includes(expectedIntent)
    );

    expect(writeCases.length).toBeGreaterThan(0);
    expect(writeCases.every(({ requiresApproval }) => requiresApproval)).toBe(true);
  });
});
