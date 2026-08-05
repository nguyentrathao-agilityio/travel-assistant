export type TravelEvaluationCase = {
  name: string;
  input: string;
  expectedIntent: 'general' | 'explore' | 'plan' | 'book_flight' | 'book_hotel' | 'cancel_booking';
  requiredFields?: string[];
  expectedTools?: string[];
  requiresApproval?: boolean;
  criteria: Array<
    | 'intent_accuracy'
    | 'required_field_extraction'
    | 'tool_selection'
    | 'answer_relevance'
    | 'grounded_results'
    | 'no_unsupported_write'
    | 'approval_required'
    | 'no_duplicate_ui_content'
  >;
};

/**
 * Provider-free regression dataset. Model-backed trajectory evaluation may consume the same
 * cases, but this module is safe to import from unit tests and CI.
 */
export const TRAVEL_REGRESSION_CASES: TravelEvaluationCase[] = [
  {
    name: 'Da Nang weather',
    input: 'What is the weather in Da Nang?',
    expectedIntent: 'plan',
    requiredFields: ['destination'],
    expectedTools: ['weatherTool'],
    criteria: [
      'intent_accuracy',
      'required_field_extraction',
      'tool_selection',
      'grounded_results',
    ],
  },
  {
    name: 'weather-dependent hotel request',
    input: 'Check Da Nang weather and find a hotel if the weather is suitable.',
    expectedIntent: 'plan',
    requiredFields: ['destination'],
    expectedTools: ['weatherTool', 'hotelTool'],
    criteria: ['tool_selection', 'answer_relevance', 'grounded_results'],
  },
  {
    name: 'hotel follow-up selection',
    input: 'Book the second one.',
    expectedIntent: 'book_hotel',
    requiresApproval: true,
    criteria: ['intent_accuracy', 'no_unsupported_write', 'approval_required'],
  },
  {
    name: 'flight booking missing fields',
    input: 'Book a flight.',
    expectedIntent: 'book_flight',
    requiredFields: ['flightId'],
    requiresApproval: true,
    criteria: ['required_field_extraction', 'no_unsupported_write', 'approval_required'],
  },
  {
    name: 'concise hotel presentation',
    input: 'Find hotels in Da Nang.',
    expectedIntent: 'plan',
    requiredFields: ['destination'],
    expectedTools: ['hotelTool'],
    criteria: ['grounded_results', 'no_duplicate_ui_content'],
  },
];
