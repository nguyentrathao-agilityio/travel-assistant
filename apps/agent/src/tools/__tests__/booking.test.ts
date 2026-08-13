import { afterEach, describe, expect, it, vi } from 'vitest';

const getFlightMock = vi.fn();
const submitFlightBookingMock = vi.fn();
const revalidateHotelMock = vi.fn();
const submitHotelBookingMock = vi.fn();
const getBookingMock = vi.fn();
const cancelBookingMock = vi.fn();

vi.mock('@/services', () => ({
  getFlight: (...args: unknown[]) => getFlightMock(...args),
  submitFlightBooking: (...args: unknown[]) => submitFlightBookingMock(...args),
  revalidateHotel: (...args: unknown[]) => revalidateHotelMock(...args),
  submitHotelBooking: (...args: unknown[]) => submitHotelBookingMock(...args),
  getBooking: (...args: unknown[]) => getBookingMock(...args),
  cancelBooking: (...args: unknown[]) => cancelBookingMock(...args),
}));

import { bookFlightTool, bookHotelTool, cancelBookingTool } from '@/tools/booking';

const toolCall = (name: string, args: object) => ({
  name,
  args,
  id: `call-${name}`,
  type: 'tool_call' as const,
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
  it('books when validation remains stable after middleware approval', async () => {
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(baseFlight);
    submitFlightBookingMock.mockResolvedValueOnce({ id: 'booking-1' });

    const result = artifactOf<{ id: string }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(submitFlightBookingMock).toHaveBeenCalledWith(flightInput, baseFlight);
    expect(result).toEqual({ id: 'booking-1' });
  });

  it('does not retry an uncertain provider timeout after the write request', async () => {
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(baseFlight);
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

  it('stops without writing when the price changes after middleware approval', async () => {
    const changedFlight = { ...baseFlight, price: 150 };
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(changedFlight);
    const result = artifactOf<{ error: string }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(result.error).toContain('Flight details changed');
    expect(submitFlightBookingMock).not.toHaveBeenCalled();
  });

  it('rejects without booking when seats are no longer sufficient after resuming', async () => {
    const soldOut = { ...baseFlight, seats_available: 0 };
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(soldOut);

    const result = artifactOf<{ error: string }>(
      await bookFlightTool.invoke(toolCall(bookFlightTool.name, flightInput))
    );

    expect(result.error).toContain('Not enough seats are available');
    expect(submitFlightBookingMock).not.toHaveBeenCalled();
  });
});

describe('bookHotelTool', () => {
  it('books when validation remains stable after middleware approval', async () => {
    revalidateHotelMock.mockResolvedValueOnce(baseHotel).mockResolvedValueOnce(baseHotel);
    submitHotelBookingMock.mockResolvedValueOnce({ id: 'booking-2' });

    const result = artifactOf<{ id: string }>(
      await bookHotelTool.invoke(toolCall(bookHotelTool.name, hotelInput))
    );

    expect(submitHotelBookingMock).toHaveBeenCalledWith(hotelInput);
    expect(result).toEqual({ id: 'booking-2' });
  });

  it('stops without writing when the total price changes after middleware approval', async () => {
    const changedHotel = { ...baseHotel, total_price: 200 };
    revalidateHotelMock.mockResolvedValueOnce(baseHotel).mockResolvedValueOnce(changedHotel);
    const result = artifactOf<{ error: string }>(
      await bookHotelTool.invoke(toolCall(bookHotelTool.name, hotelInput))
    );

    expect(result.error).toContain('Hotel details changed');
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

  it('returns the cancelled booking as an artifact after middleware approval', async () => {
    getBookingMock.mockResolvedValueOnce(booking);
    cancelBookingMock.mockResolvedValueOnce({ ...booking, status: 'cancelled' });

    const result = artifactOf<{ status: string }>(
      await cancelBookingTool.invoke(toolCall(cancelBookingTool.name, { bookingId: booking.id }))
    );

    expect(cancelBookingMock).toHaveBeenCalledWith({ bookingId: booking.id });
    expect(result.status).toBe('cancelled');
  });
});
