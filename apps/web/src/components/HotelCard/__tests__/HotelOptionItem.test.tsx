import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HotelOptionItem } from '../HotelOptionItem';
import type { HotelAvailability } from '@repo/types';

jest.mock('@/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  formatPrice: (price: number, currency: string) => `${currency} ${price}`,
  getAmenityIcon: () => null,
  getAmenityColor: () => 'amenity-color',
  getRatingColor: () => ({ bgClass: 'bg-green-100', textClass: 'text-green-800' }),
}));

jest.mock('@/constants', () => ({
  HOTEL_AMENITIES_MAX_DISPLAY: 5,
}));

jest.mock('@/components', () => ({
  Badge: ({ label }: { label: string }) => <span data-testid="badge">{label}</span>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  StarRating: ({ count }: { count: number }) => (
    <span data-testid="star-rating">{count} stars</span>
  ),
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const makeHotel = (overrides: Partial<HotelAvailability> = {}): HotelAvailability => ({
  id: 'h1',
  shortCode: 'HA',
  name: 'Hotel A',
  city: 'Da Nang',
  country: 'Vietnam',
  address: '1 Beach Rd',
  starRating: 4,
  pricePerNight: 80,
  currency: 'USD',
  amenities: ['WiFi', 'Pool', 'Gym'],
  rating: 4.2,
  reviewCount: 200,
  imageUrl: '',
  available: true,
  availableRooms: 5,
  maxOccupancyPerRoom: 2,
  nights: 3,
  totalPrice: 240,
  ...overrides,
});

describe('HotelOptionItem', () => {
  it('renders hotel name', () => {
    render(<HotelOptionItem hotel={makeHotel()} isSelected={false} />);
    expect(screen.getByText('Hotel A')).toBeInTheDocument();
  });

  it('renders star rating', () => {
    render(<HotelOptionItem hotel={makeHotel()} isSelected={false} />);
    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
  });

  it('renders price per night', () => {
    render(<HotelOptionItem hotel={makeHotel()} isSelected={false} />);
    expect(screen.getByText(/USD 80\/night/)).toBeInTheDocument();
  });

  it('renders total price', () => {
    render(<HotelOptionItem hotel={makeHotel()} isSelected={false} />);
    expect(screen.getByText(/USD 240 total/)).toBeInTheDocument();
  });

  it('renders amenities', () => {
    render(<HotelOptionItem hotel={makeHotel()} isSelected={false} />);
    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('Pool')).toBeInTheDocument();
  });

  it('shows "+N more" when amenities exceed HOTEL_AMENITIES_MAX_DISPLAY (5)', () => {
    const hotel = makeHotel({
      amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Parking'],
    });

    render(<HotelOptionItem hotel={hotel} isSelected={false} />);
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('renders image when imageUrl is provided', () => {
    const hotel = makeHotel({ imageUrl: 'https://example.com/hotel.jpg' });

    render(<HotelOptionItem hotel={hotel} isSelected={false} />);
    const img = screen.getByRole('img', { name: 'Hotel A' });

    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/hotel.jpg');
  });

  it('does not render image when imageUrl is empty', () => {
    render(<HotelOptionItem hotel={makeHotel({ imageUrl: '' })} isSelected={false} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders Select button when onSelect is provided', () => {
    render(<HotelOptionItem hotel={makeHotel()} isSelected={false} onSelect={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
  });

  it('calls onSelect with hotel id when Select is clicked', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();

    render(<HotelOptionItem hotel={makeHotel()} isSelected={false} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledWith('h1');
  });

  it('shows "Selected" when isSelected is true', () => {
    render(<HotelOptionItem hotel={makeHotel()} isSelected={true} onSelect={jest.fn()} />);
    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Select' })).not.toBeInTheDocument();
  });

  it('renders badge when badge prop is provided', () => {
    render(<HotelOptionItem hotel={makeHotel()} isSelected={false} badge="Best value" />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByText('Best value')).toBeInTheDocument();
  });

  it('shows rating value', () => {
    render(<HotelOptionItem hotel={makeHotel()} isSelected={false} />);
    expect(screen.getByText(/4.2\/5/)).toBeInTheDocument();
  });
});
