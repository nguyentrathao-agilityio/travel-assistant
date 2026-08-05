import { HumanMessage, ToolMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';

import { buildDomainStateUpdate } from '../domain-state-middleware';

const toolResult = (name: string, artifact: unknown) =>
  new ToolMessage({
    name,
    content: JSON.stringify(artifact),
    artifact,
    tool_call_id: `call-${name}`,
  });

const flightResult = {
  count: 1,
  results: [
    {
      id: 'flight-1',
      airline: { code: 'VN', name: 'Vietnam Airlines' },
      flightNumber: 'VN101',
      origin: 'HAN',
      destination: 'DAD',
      departureTime: '2026-08-14T08:00:00+07:00',
      arrivalTime: '2026-08-14T09:20:00+07:00',
      durationMinutes: 80,
      price: 100,
      currency: 'USD',
      seatsAvailable: 4,
      stops: 0,
    },
  ],
};

describe('domain state persistence', () => {
  it('retains validated search artifacts for follow-up turns', () => {
    const update = buildDomainStateUpdate('plan', [
      new HumanMessage('Find a flight'),
      toolResult('flightsTool', flightResult),
    ]);

    expect(update.searchResults).toEqual({ flights: flightResult });
    expect(update.execution).toEqual({ currentNode: 'plan', completedTasks: ['plan'] });
    expect(update).not.toHaveProperty('request');
    expect(update).not.toHaveProperty('messages');
  });

  it('ignores invalid and unrelated artifacts instead of corrupting state', () => {
    const update = buildDomainStateUpdate('explore', [
      new HumanMessage('Explore Da Nang'),
      toolResult('placesTool', { unexpected: true }),
      toolResult('knowledgeSearchTool', { results: [] }),
    ]);

    expect(update).not.toHaveProperty('searchResults');
  });

  it('does not replay artifacts from an earlier user turn', () => {
    const update = buildDomainStateUpdate('general', [
      new HumanMessage('Find a flight'),
      toolResult('flightsTool', flightResult),
      new HumanMessage('Thanks'),
    ]);

    expect(update).not.toHaveProperty('searchResults');
  });

  it('marks a selection booked only after a validated confirmed booking result', () => {
    const booking = {
      id: 'booking-1',
      confirmationCode: 'TRIP-123',
      type: 'flight',
      referenceId: 'flight-1',
      customerName: 'Nguyen Van A',
      customerEmail: 'a@example.com',
      totalPrice: 100,
      currency: 'USD',
      status: 'confirmed',
      createdAt: '2026-08-05T10:00:00Z',
      summary: 'HAN to DAD',
    };

    const update = buildDomainStateUpdate('bookFlight', [
      new HumanMessage('Book it'),
      toolResult('bookFlightTool', booking),
    ]);

    expect(update.flightSelectionStatus).toBe('booked');
    expect(update.selectedOptions).toEqual({ flightId: 'flight-1' });
  });

  it('persists serializable provider recovery metadata without sensitive input', () => {
    const update = buildDomainStateUpdate('plan', [
      new HumanMessage('Search hotels'),
      toolResult('hotelTool', {
        error: 'The provider is unavailable.',
        message: 'The provider is unavailable.',
        code: 'PROVIDER_UNAVAILABLE',
        retryable: true,
        provider: 'travel-api',
      }),
    ]);

    expect(update.execution).toMatchObject({
      errors: [
        expect.objectContaining({
          node: 'plan',
          operation: 'hotelTool',
          provider: 'travel-api',
          code: 'PROVIDER_ERROR',
          retryable: true,
        }),
      ],
    });
    expect(() => JSON.stringify(update.execution)).not.toThrow();
  });

  it('marks booking timeouts as write status unknown', () => {
    const update = buildDomainStateUpdate('cancelBooking', [
      new HumanMessage('Cancel it'),
      toolResult('cancelBookingTool', {
        error: 'Provider timed out',
        message: 'Provider timed out',
        code: 'TIMEOUT',
        retryable: false,
        provider: 'travel-api',
      }),
    ]);

    expect(update.execution).toMatchObject({
      errors: [expect.objectContaining({ code: 'WRITE_STATUS_UNKNOWN', retryable: false })],
    });
  });
});
