import assert from 'node:assert/strict';
import test from 'node:test';

import type { Flight, HotelAvailability } from '@repo/types';

import {
  cancellationRejection,
  computeFlightBadgeKinds,
  computeHotelBadgeKinds,
  formatDuration,
  getBestDayIndex,
  parseToolResult,
  replaceCostEstimateWithBookings,
} from './index';

const flight = (id: string, price: number, durationMinutes: number): Flight => ({
  id,
  airline: { code: 'VN', name: 'Vietnam Airlines' },
  flightNumber: `VN-${id}`,
  origin: 'SGN',
  destination: 'HAN',
  departureTime: '2026-09-08T08:00:00',
  arrivalTime: '2026-09-08T10:00:00',
  durationMinutes,
  price,
  currency: 'USD',
  seatsAvailable: 4,
  stops: 0,
});

const hotel = (id: string, pricePerNight: number, rating: number): HotelAvailability => ({
  id,
  shortCode: id,
  name: id,
  city: 'Hanoi',
  country: 'Vietnam',
  address: '1 Main Street',
  starRating: 4,
  pricePerNight,
  currency: 'USD',
  amenities: [],
  rating,
  reviewCount: 20,
  available: true,
  availableRooms: 3,
  maxOccupancyPerRoom: 2,
  nights: 2,
  totalPrice: pricePerNight * 2,
});

test('formatDuration preserves rounded hours and minutes', () => {
  assert.equal(formatDuration(90), '1h 30m');
  assert.equal(formatDuration(120), '2h');
});

test('parseToolResult parses JSON but preserves ordinary and malformed strings', () => {
  assert.deepEqual(parseToolResult(' {"ok":true} '), { ok: true });
  assert.equal(parseToolResult('plain text'), 'plain text');
  assert.equal(parseToolResult('{broken'), '{broken');
});

test('computeFlightBadgeKinds identifies cheapest, fastest, and remaining popular flight', () => {
  assert.deepEqual(
    [
      ...computeFlightBadgeKinds([
        flight('cheap', 80, 150),
        flight('fast', 100, 90),
        flight('other', 120, 120),
      ]),
    ],
    [
      ['cheap', 'cheapest'],
      ['fast', 'fastest'],
      ['other', 'popular'],
    ]
  );
});

test('computeHotelBadgeKinds identifies cheapest, best-rated, and remaining best-value hotel', () => {
  assert.deepEqual(
    [
      ...computeHotelBadgeKinds([
        hotel('cheap', 80, 4),
        hotel('rated', 120, 5),
        hotel('other', 100, 4.5),
      ]),
    ],
    [
      ['cheap', 'cheapest'],
      ['rated', 'bestRated'],
      ['other', 'bestValue'],
    ]
  );
});

test('booking cancellation rejection keeps the booking active', () => {
  assert.equal(
    cancellationRejection('booking-7'),
    'The user rejected the cancellation. Booking booking-7 remains active and was NOT cancelled.'
  );
});

test('getBestDayIndex selects the day with the lowest precipitation chance', () => {
  assert.equal(
    getBestDayIndex([
      {
        date: '2026-09-08',
        tempMinC: 22,
        tempMaxC: 30,
        precipitationProbabilityMax: 80,
        description: 'Rainy',
      },
      {
        date: '2026-09-09',
        tempMinC: 21,
        tempMaxC: 29,
        precipitationProbabilityMax: 10,
        description: 'Clear',
      },
    ]),
    1
  );
});

test('replaceCostEstimateWithBookings replaces estimated flight and hotel totals', () => {
  const result = replaceCostEstimateWithBookings({
    costEstimate: {
      currency: 'USD',
      grandTotal: 500,
      flightTotal: 200,
      hotelTotal: 300,
      foodTotal: 0,
      activitiesTotal: 0,
      localTransportTotal: 0,
      days: 2,
      travelers: 1,
      breakdown: [
        { label: 'Flights', amount: 200, currency: 'USD' },
        { label: 'Hotel', amount: 300, currency: 'USD' },
      ],
    },
    days: 2,
    travelers: 1,
    bookedFlight: {
      departure: {
        id: 'flight-1',
        airline: { code: 'VN', name: 'Vietnam Airlines' },
        flightNumber: 'VN1',
        origin: 'SGN',
        destination: 'HAN',
        departureTime: '2026-09-08T08:00:00',
        arrivalTime: '2026-09-08T10:00:00',
        durationMinutes: 120,
        price: 150,
        currency: 'USD',
        seatsAvailable: 4,
        stops: 0,
      },
    },
    bookedHotel: {
      id: 'hotel-1',
      shortCode: 'H1',
      name: 'Hotel One',
      city: 'Hanoi',
      country: 'Vietnam',
      address: '1 Main Street',
      starRating: 4,
      pricePerNight: 100,
      currency: 'USD',
      amenities: [],
      rating: 4.5,
      reviewCount: 20,
    },
  });

  assert.equal(result.grandTotal, 350);
  assert.deepEqual(
    result.breakdown.map(({ amount }) => amount),
    [150, 200]
  );
});
