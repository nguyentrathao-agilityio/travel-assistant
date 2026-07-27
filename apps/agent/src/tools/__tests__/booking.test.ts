import { afterEach, describe, expect, it, vi } from 'vitest';

const { interruptMock } = vi.hoisted(() => ({ interruptMock: vi.fn() }));
vi.mock('@langchain/langgraph', () => ({
  interrupt: interruptMock,
}));

const getFlightMock = vi.fn();
const submitFlightBookingMock = vi.fn();
const revalidateHotelMock = vi.fn();
const submitHotelBookingMock = vi.fn();

vi.mock('../../services', () => ({
  getFlight: (...args: unknown[]) => getFlightMock(...args),
  submitFlightBooking: (...args: unknown[]) => submitFlightBookingMock(...args),
  revalidateHotel: (...args: unknown[]) => revalidateHotelMock(...args),
  submitHotelBooking: (...args: unknown[]) => submitHotelBookingMock(...args),
  getBooking: vi.fn(),
  cancelBooking: vi.fn(),
}));

import { bookFlightTool, bookHotelTool } from '../booking';

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
  it('books immediately when nothing changed between approval and re-verification', async () => {
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(baseFlight);
    interruptMock.mockReturnValueOnce({ decision: 'approve' });
    submitFlightBookingMock.mockResolvedValueOnce({ id: 'booking-1' });

    const result = JSON.parse(await bookFlightTool.invoke(flightInput));

    expect(interruptMock).toHaveBeenCalledTimes(1);
    expect(submitFlightBookingMock).toHaveBeenCalledWith(flightInput, baseFlight);
    expect(result).toEqual({ id: 'booking-1' });
  });

  it('asks for approval again when the price changed after the first approval', async () => {
    const changedFlight = { ...baseFlight, price: 150 };
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(changedFlight);
    interruptMock
      .mockReturnValueOnce({ decision: 'approve' })
      .mockReturnValueOnce({ decision: 'approve' });
    submitFlightBookingMock.mockResolvedValueOnce({ id: 'booking-1' });

    const result = JSON.parse(await bookFlightTool.invoke(flightInput));

    expect(interruptMock).toHaveBeenCalledTimes(2);
    expect(submitFlightBookingMock).toHaveBeenCalledWith(flightInput, changedFlight);
    expect(result).toEqual({ id: 'booking-1' });
  });

  it('rejects without booking when seats are no longer sufficient after resuming', async () => {
    const soldOut = { ...baseFlight, seats_available: 0 };
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(soldOut);
    interruptMock.mockReturnValueOnce({ decision: 'approve' });

    const result = JSON.parse(await bookFlightTool.invoke(flightInput));

    expect(result.error).toContain('Not enough seats are available');
    expect(submitFlightBookingMock).not.toHaveBeenCalled();
  });

  it('rejects without booking when the user declines the first approval', async () => {
    getFlightMock.mockResolvedValueOnce(baseFlight);
    interruptMock.mockReturnValueOnce({ decision: 'reject' });

    const result = JSON.parse(await bookFlightTool.invoke(flightInput));

    expect(result).toEqual({ status: 'rejected', type: 'flight' });
    expect(submitFlightBookingMock).not.toHaveBeenCalled();
  });

  it('rejects without booking when the user declines the second approval', async () => {
    const changedFlight = { ...baseFlight, price: 150 };
    getFlightMock.mockResolvedValueOnce(baseFlight).mockResolvedValueOnce(changedFlight);
    interruptMock
      .mockReturnValueOnce({ decision: 'approve' })
      .mockReturnValueOnce({ decision: 'reject' });

    const result = JSON.parse(await bookFlightTool.invoke(flightInput));

    expect(result).toEqual({ status: 'rejected', type: 'flight' });
    expect(submitFlightBookingMock).not.toHaveBeenCalled();
  });
});

describe('bookHotelTool', () => {
  it('books immediately when nothing changed between approval and re-verification', async () => {
    revalidateHotelMock.mockResolvedValueOnce(baseHotel).mockResolvedValueOnce(baseHotel);
    interruptMock.mockReturnValueOnce({ decision: 'approve' });
    submitHotelBookingMock.mockResolvedValueOnce({ id: 'booking-2' });

    const result = JSON.parse(await bookHotelTool.invoke(hotelInput));

    expect(interruptMock).toHaveBeenCalledTimes(1);
    expect(submitHotelBookingMock).toHaveBeenCalledWith(hotelInput);
    expect(result).toEqual({ id: 'booking-2' });
  });

  it('asks for approval again when the total price changed after the first approval', async () => {
    const changedHotel = { ...baseHotel, total_price: 200 };
    revalidateHotelMock.mockResolvedValueOnce(baseHotel).mockResolvedValueOnce(changedHotel);
    interruptMock
      .mockReturnValueOnce({ decision: 'approve' })
      .mockReturnValueOnce({ decision: 'approve' });
    submitHotelBookingMock.mockResolvedValueOnce({ id: 'booking-2' });

    const result = JSON.parse(await bookHotelTool.invoke(hotelInput));

    expect(interruptMock).toHaveBeenCalledTimes(2);
    expect(submitHotelBookingMock).toHaveBeenCalledWith(hotelInput);
    expect(result).toEqual({ id: 'booking-2' });
  });

  it('rejects without booking when the user declines the first approval', async () => {
    revalidateHotelMock.mockResolvedValueOnce(baseHotel);
    interruptMock.mockReturnValueOnce({ decision: 'reject' });

    const result = JSON.parse(await bookHotelTool.invoke(hotelInput));

    expect(result).toEqual({ status: 'rejected', type: 'hotel' });
    expect(submitHotelBookingMock).not.toHaveBeenCalled();
  });
});
