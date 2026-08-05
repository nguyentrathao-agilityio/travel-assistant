import { afterEach, describe, expect, it, vi } from 'vitest';

const { interruptMock } = vi.hoisted(() => ({ interruptMock: vi.fn() }));
vi.mock('@langchain/langgraph', () => ({
  interrupt: interruptMock,
}));

const getFlightMock = vi.fn();
const submitFlightBookingMock = vi.fn();
const revalidateHotelMock = vi.fn();
const submitHotelBookingMock = vi.fn();
const getBookingMock = vi.fn();
const cancelBookingMock = vi.fn();

vi.mock('../../services', () => ({
  getFlight: (...args: unknown[]) => getFlightMock(...args),
  submitFlightBooking: (...args: unknown[]) => submitFlightBookingMock(...args),
  revalidateHotel: (...args: unknown[]) => revalidateHotelMock(...args),
  submitHotelBooking: (...args: unknown[]) => submitHotelBookingMock(...args),
  getBooking: (...args: unknown[]) => getBookingMock(...args),
  cancelBooking: (...args: unknown[]) => cancelBookingMock(...args),
}));

import { bookFlightTool, bookHotelTool, cancelBookingTool } from '../booking';

const toolCall = (name: string, args: object) => ({
  name,
  args,
  id: `call-${name}`,
  type: 'tool_call' as const,
});

const approvalResponse = (decision: 'approve' | 'reject') => (request: { approvalId: string }) => ({
  decision,
  approvalId: request.approvalId,
});

const artifactOf = <T>(result: unknown): T => {
  if (typeof result === 'object' && result !== null && 'artifact' in result) {
    return result.artifact as T;
  }

  throw new Error('Expected a ToolMessage with an artifact');
};

const baseFlight = {
  id: 'FL1',
  airline: { code: 'VN', name: 'Vietnam Airlines' },
  flight_number: 'VN101',
  origin: 'DAD',
  destination: 'SGN',
  departure_time: '2026-07-30T08:00:00+07:00',
  arrival_time: '2026-07-30T09:25:00+07:00',
  duration_minutes: 85,
  price: 120,
  currency: 'USD',
  seats_available: 4,
  stops: 0,
};

const flightInput = {
  flightId: 'FL1',
  adults: 1,
  customerName: 'Nguyen Van A',
  customerEmail: 'a@example.com',
  customerPhone: '+84901234567',
};

const baseHotel = {
  id: 'hotel-1',
  short_code: 'HTL-ONE',
  code: 'ONE',
  name: 'Hotel One',
  city: 'Da Nang',
  country: 'Vietnam',
  address: '1 Beach Road',
  star_rating: 4,
  price_per_night: 90,
  currency: 'USD',
  amenities: ['wifi'],
  rating: 4.5,
  review_count: 100,
  image_url: 'https://example.com/hotel.jpg',
  available: true,
  available_rooms: 3,
  max_occupancy_per_room: 2,
  nights: 2,
  total_price: 180,
};

const hotelInput = {
  hotelId: 'hotel-1',
  city: 'Da Nang',
  checkIn: '2026-08-01',
  checkOut: '2026-08-03',
  rooms: 1,
  adults: 2,
  children: 0,
  customerName: 'Nguyen Van A',
  customerEmail: 'a@example.com',
  customerPhone: '+84901234567',
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('bookFlightTool', () => {
  it('requires fresh approval when a resumed response belongs to an older quote', async () => {
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(baseFlight);
    interruptMock
      .mockReturnValueOnce({ decision: 'approve', approvalId: 'stale-quote' })
      .mockImplementationOnce(approvalResponse('approve'));
    submitFlightBookingMock.mockResolvedValueOnce({ id: 'booking-1' });

    const result = artifactOf<{ id: string }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(interruptMock).toHaveBeenCalledTimes(2);
    expect(submitFlightBookingMock).toHaveBeenCalledWith(flightInput, baseFlight);
    expect(result).toEqual({ id: 'booking-1' });
  });

  it('books immediately when nothing changed between approval and re-verification', async () => {
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(baseFlight);
    interruptMock.mockImplementationOnce(approvalResponse('approve'));
    submitFlightBookingMock.mockResolvedValueOnce({ id: 'booking-1' });

    const result = artifactOf<{ id: string }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(interruptMock).toHaveBeenCalledTimes(1);
    expect(submitFlightBookingMock).toHaveBeenCalledWith(flightInput, baseFlight);
    expect(result).toEqual({ id: 'booking-1' });
  });

  it('does not retry an uncertain provider timeout after the write request', async () => {
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(baseFlight);
    interruptMock.mockImplementationOnce(approvalResponse('approve'));
    submitFlightBookingMock.mockRejectedValueOnce(new Error('Provider timeout'));

    const result = artifactOf<{ error: string }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(result).toEqual(
      expect.objectContaining({
        error: 'Provider timeout',
        code: 'TIMEOUT',
        retryable: false,
      })
    );
    expect(submitFlightBookingMock).toHaveBeenCalledTimes(1);
  });

  it('asks for approval again when the price changed after the first approval', async () => {
    const changedFlight = { ...baseFlight, price: 150 };
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(changedFlight);
    interruptMock
      .mockImplementationOnce(approvalResponse('approve'))
      .mockImplementationOnce(approvalResponse('approve'));
    submitFlightBookingMock.mockResolvedValueOnce({ id: 'booking-1' });

    const result = artifactOf<{ id: string }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(interruptMock).toHaveBeenCalledTimes(2);
    expect(submitFlightBookingMock).toHaveBeenCalledWith(flightInput, changedFlight);
    expect(result).toEqual({ id: 'booking-1' });
  });

  it('rejects without booking when seats are no longer sufficient after resuming', async () => {
    const soldOut = { ...baseFlight, seats_available: 0 };
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(soldOut);
    interruptMock.mockImplementationOnce(approvalResponse('approve'));

    const result = artifactOf<{ error: string }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(result.error).toContain('Not enough seats are available');
    expect(submitFlightBookingMock).not.toHaveBeenCalled();
  });

  it('rejects without booking when the user declines the first approval', async () => {
    getFlightMock.mockResolvedValueOnce(baseFlight);
    interruptMock.mockImplementationOnce(approvalResponse('reject'));

    const result = artifactOf<{ status: string; type: string }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(result).toEqual({ status: 'rejected', type: 'flight' });
    expect(submitFlightBookingMock).not.toHaveBeenCalled();
  });

  it('returns requested edits without executing a booking write', async () => {
    getFlightMock.mockResolvedValueOnce(baseFlight);
    interruptMock.mockImplementationOnce((request: { approvalId: string }) => ({
      decision: 'edit',
      approvalId: request.approvalId,
      edits: { adults: 2 },
    }));

    const result = artifactOf<{ status: string; edits: { adults: number } }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(result).toEqual({ status: 'edit_requested', type: 'flight', edits: { adults: 2 } });
    expect(submitFlightBookingMock).not.toHaveBeenCalled();
  });

  it('rejects without booking when the user declines the second approval', async () => {
    const changedFlight = { ...baseFlight, price: 150 };
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(changedFlight);
    interruptMock
      .mockImplementationOnce(approvalResponse('approve'))
      .mockImplementationOnce(approvalResponse('reject'));

    const result = artifactOf<{ status: string; type: string }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(result).toEqual({ status: 'rejected', type: 'flight' });
    expect(submitFlightBookingMock).not.toHaveBeenCalled();
  });
});

describe('bookHotelTool', () => {
  it('books immediately when nothing changed between approval and re-verification', async () => {
    revalidateHotelMock.mockResolvedValueOnce(baseHotel).mockResolvedValueOnce(baseHotel);
    interruptMock.mockImplementationOnce(approvalResponse('approve'));
    submitHotelBookingMock.mockResolvedValueOnce({ id: 'booking-2' });

    const result = artifactOf<{ id: string }>(
      await bookHotelTool.invoke(toolCall(bookHotelTool.name, hotelInput))
    );

    expect(interruptMock).toHaveBeenCalledTimes(1);
    expect(submitHotelBookingMock).toHaveBeenCalledWith(hotelInput);
    expect(result).toEqual({ id: 'booking-2' });
  });

  it('asks for approval again when the total price changed after the first approval', async () => {
    const changedHotel = { ...baseHotel, total_price: 200 };
    revalidateHotelMock.mockResolvedValueOnce(baseHotel).mockResolvedValueOnce(changedHotel);
    interruptMock
      .mockImplementationOnce(approvalResponse('approve'))
      .mockImplementationOnce(approvalResponse('approve'));
    submitHotelBookingMock.mockResolvedValueOnce({ id: 'booking-2' });

    const result = artifactOf<{ id: string }>(
      await bookHotelTool.invoke(toolCall(bookHotelTool.name, hotelInput))
    );

    expect(interruptMock).toHaveBeenCalledTimes(2);
    expect(submitHotelBookingMock).toHaveBeenCalledWith(hotelInput);
    expect(result).toEqual({ id: 'booking-2' });
  });

  it('rejects without booking when the user declines the first approval', async () => {
    revalidateHotelMock.mockResolvedValueOnce(baseHotel);
    interruptMock.mockImplementationOnce(approvalResponse('reject'));

    const result = artifactOf<{ status: string; type: string }>(
      await bookHotelTool.invoke(toolCall(bookHotelTool.name, hotelInput))
    );

    expect(result).toEqual({ status: 'rejected', type: 'hotel' });
    expect(submitHotelBookingMock).not.toHaveBeenCalled();
  });
});

describe('cancelBookingTool', () => {
  const booking = {
    id: 'booking-1',
    confirmationCode: 'CONF-1',
    type: 'flight',
    customerName: 'Nguyen Van A',
    totalPrice: 120,
    currency: 'USD',
    status: 'confirmed',
    summary: 'Vietnam Airlines VN101',
  };

  it('returns the cancelled booking as an artifact after approval', async () => {
    getBookingMock.mockResolvedValueOnce(booking);
    interruptMock.mockImplementationOnce(approvalResponse('approve'));
    cancelBookingMock.mockResolvedValueOnce({ ...booking, status: 'cancelled' });

    const result = artifactOf<{ status: string }>(
      await cancelBookingTool.invoke(toolCall(cancelBookingTool.name, { bookingId: booking.id }))
    );

    expect(cancelBookingMock).toHaveBeenCalledWith({ bookingId: booking.id });
    expect(result.status).toBe('cancelled');
  });

  it('does not cancel when approval is rejected', async () => {
    getBookingMock.mockResolvedValueOnce(booking);
    interruptMock.mockImplementationOnce(approvalResponse('reject'));

    const result = artifactOf<{ status: string; type: string }>(
      await cancelBookingTool.invoke(toolCall(cancelBookingTool.name, { bookingId: booking.id }))
    );

    expect(result).toEqual({ status: 'rejected', type: 'cancellation' });
    expect(cancelBookingMock).not.toHaveBeenCalled();
  });
});
