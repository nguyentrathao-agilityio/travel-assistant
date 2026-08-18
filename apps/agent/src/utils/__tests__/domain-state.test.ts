import { HumanMessage, ToolMessage } from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';

// Utils
import { buildDomainStateUpdate } from '@/utils/domain-state';

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

    const update = buildDomainStateUpdate('booking', [
      new HumanMessage('Book it'),
      toolResult('bookFlightTool', booking),
    ]);

    expect(update.flightSelectionStatus).toBe('booked');
    expect(update.selectedOptions).toEqual({ flightId: 'flight-1' });
    expect(update.flightBooking).toEqual(booking);
  });

  it('persists the confirmed hotel booking record for later recall', () => {
    const booking = {
      id: 'booking-2',
      confirmationCode: 'TRIP-456',
      type: 'hotel',
      referenceId: 'hotel-1',
      customerName: 'Nguyen Van A',
      customerEmail: 'a@example.com',
      totalPrice: 300,
      currency: 'USD',
      status: 'confirmed',
      createdAt: '2026-08-05T10:00:00Z',
      summary: 'Test Hotel, Da Nang',
    };

    const update = buildDomainStateUpdate('booking', [
      new HumanMessage('Book it'),
      toolResult('bookHotelTool', booking),
    ]);

    expect(update.hotelSelectionStatus).toBe('booked');
    expect(update.selectedOptions).toEqual({ hotelId: 'hotel-1' });
    expect(update.hotelBooking).toEqual(booking);
  });

  it.each(['flight', 'hotel'] as const)(
    'persists a cancelled %s booking and marks its selection cancelled',
    (type) => {
      const booking = {
        id: `booking-cancelled-${type}`,
        confirmationCode: `CANCEL-${type}`,
        type,
        referenceId: `${type}-1`,
        customerName: 'Nguyen Van A',
        customerEmail: 'a@example.com',
        totalPrice: 100,
        currency: 'USD',
        status: 'cancelled' as const,
        createdAt: '2026-08-05T10:00:00Z',
        summary: `${type} cancelled`,
      };

      const update = buildDomainStateUpdate('booking', [
        new HumanMessage('Cancel it'),
        toolResult('cancelBookingTool', booking),
      ]);

      expect(update).toMatchObject({
        [`${type}Booking`]: booking,
        [`${type}SelectionStatus`]: 'cancelled',
        selectedOptions: { [`${type}Id`]: undefined },
      });
    }
  );

  it('warns instead of silently dropping an invalid booking tool artifact', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const update = buildDomainStateUpdate('booking', [
      new HumanMessage('Book it'),
      toolResult('bookFlightTool', { unexpected: true }),
    ]);

    expect(update).not.toHaveProperty('flightBooking');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Booking tool artifact failed validation'),
      expect.objectContaining({ tool: 'bookFlightTool' })
    );

    warnSpy.mockRestore();
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
    const update = buildDomainStateUpdate('booking', [
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
