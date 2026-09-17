import { extractTripState } from '../tripState';

test('returns an empty object when values is undefined', () => {
  expect(extractTripState(undefined)).toEqual({});
});

test('returns an empty object when values has no trip-state keys', () => {
  expect(extractTripState({ classifiedIntent: 'explore', someInternalField: 42 })).toEqual({});
});

test('picks only known TripState keys, dropping internal graph state', () => {
  const values = {
    destination: 'Da Nang',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    travelers: 2,
    classifiedIntent: 'plan',
    messages: [{ role: 'human', content: 'hi' }],
  };

  expect(extractTripState(values)).toEqual({
    destination: 'Da Nang',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    travelers: 2,
  });
});

test('includes flight and hotel booking state when present', () => {
  const values = {
    flights: [{ id: 'f1' }],
    flightSelectionStatus: 'selected',
    flightBooking: { id: 'b1' },
    hotel: { id: 'h1' },
    hotelSelectionStatus: 'confirmed',
    hotelBooking: { id: 'b2' },
    clientDate: '2026-09-17',
    clientTimezone: 'Asia/Ho_Chi_Minh',
  };

  expect(extractTripState(values)).toEqual(values);
});

test('omits keys whose value is undefined but keeps falsy values like 0 and empty string', () => {
  const values = { travelers: 0, destination: '', startDate: undefined };

  expect(extractTripState(values)).toEqual({ travelers: 0, destination: '' });
});

test('keeps null values for known keys', () => {
  expect(extractTripState({ hotel: null })).toEqual({ hotel: null });
});
