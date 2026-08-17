import React from 'react';
import { render, screen } from '@testing-library/react';
import { TripHotelSection } from '../TripHotelSection';
import type { HotelAvailability } from '@repo/schemas';

jest.mock('@/components', () => ({
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  HotelOptionItem: ({ hotel }: { hotel: { name: string } }) => (
    <div data-testid="hotel-option-item">{hotel.name}</div>
  ),
}));

jest.mock('@/utils', () => ({ cn: (...args: string[]) => args.filter(Boolean).join(' ') }));

const makeHotel = (): HotelAvailability => ({
  id: 'h1',
  shortCode: 'HA',
  code: 'HA001',
  name: 'Hotel A',
  city: 'Da Nang',
  country: 'Vietnam',
  address: '1 Beach Rd',
  starRating: 4,
  pricePerNight: 80,
  currency: 'USD',
  amenities: ['WiFi', 'Pool'],
  rating: 4.2,
  reviewCount: 200,
  imageUrl: '',
  available: true,
  availableRooms: 5,
  maxOccupancyPerRoom: 2,
  nights: 3,
  totalPrice: 240,
});

describe('TripHotelSection', () => {
  it('returns null when neither suggested nor booked is provided', () => {
    const { container } = render(<TripHotelSection nights={3} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders hotel info when suggested is provided', () => {
    const hotel = makeHotel();

    render(<TripHotelSection suggested={hotel} nights={3} />);
    expect(screen.getByTestId('hotel-option-item')).toBeInTheDocument();
    expect(screen.getByText('Hotel A')).toBeInTheDocument();
  });

  it('shows "suggested" badge when no booked hotel', () => {
    const hotel = makeHotel();

    render(<TripHotelSection suggested={hotel} nights={3} />);
    expect(screen.getByText('suggested')).toBeInTheDocument();
  });

  it('shows "booked" badge when booked hotel is provided', () => {
    const hotel = makeHotel();

    render(<TripHotelSection booked={hotel} nights={3} />);
    expect(screen.getByText('booked')).toBeInTheDocument();
  });

  it('renders hotel option item when booked hotel is provided', () => {
    const hotel = makeHotel();

    render(<TripHotelSection booked={hotel} nights={3} />);
    expect(screen.getByTestId('hotel-option-item')).toBeInTheDocument();
  });
});
