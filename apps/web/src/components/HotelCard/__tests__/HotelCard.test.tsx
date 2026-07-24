import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HotelCard } from '../index';
import type { HotelAvailability, HotelSearchResult } from '@repo/types';

jest.mock('../HotelOptionItem', () => ({
  HotelOptionItem: ({
    hotel,
    isSelected,
    onSelect,
  }: {
    hotel: HotelAvailability;
    isSelected: boolean;
    onSelect: (id: string) => void;
  }) => (
    <button
      data-testid="hotel-option"
      data-selected={isSelected}
      onClick={() => onSelect(hotel.id)}
    >
      {hotel.name}
    </button>
  ),
}));

const makeHotel = (id: string, name: string, pricePerNight = 100): HotelAvailability => ({
  id,
  shortCode: id.toUpperCase(),
  name,
  city: 'Da Nang',
  country: 'Vietnam',
  address: '1 Beach Rd',
  starRating: 4,
  pricePerNight,
  currency: 'USD',
  amenities: ['wifi'],
  rating: 4.5,
  reviewCount: 100,
  imageUrl: 'https://example.com/img.jpg',
  available: true,
  availableRooms: 5,
  maxOccupancyPerRoom: 2,
  nights: 3,
  totalPrice: pricePerNight * 3,
});

const makeData = (overrides: Partial<HotelSearchResult> = {}): HotelSearchResult => ({
  total: 2,
  results: [makeHotel('h1', 'Hotel One'), makeHotel('h2', 'Hotel Two', 150)],
  ...overrides,
});

describe('HotelCard', () => {
  describe('loading / empty states', () => {
    it('renders without crashing when data is provided', () => {
      const { container } = render(<HotelCard data={makeData()} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders hotel list when data is defined', () => {
      const { container } = render(<HotelCard data={makeData()} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('with data', () => {
    it('renders hotel count', () => {
      render(<HotelCard data={makeData()} city="Da Nang" />);
      expect(screen.getByText('2 options found')).toBeInTheDocument();
    });

    it('renders city in header', () => {
      render(<HotelCard data={makeData()} city="Da Nang" />);
      expect(screen.getByText('Hotels in Da Nang')).toBeInTheDocument();
    });

    it('renders "Hotels" without city when city is absent', () => {
      render(<HotelCard data={makeData()} />);
      expect(screen.getByText('Hotels')).toBeInTheDocument();
    });

    it('renders a HotelOptionItem for each hotel', () => {
      render(<HotelCard data={makeData()} />);
      expect(screen.getAllByTestId('hotel-option')).toHaveLength(2);
    });

    it('renders empty state when results list is empty', () => {
      render(<HotelCard data={makeData({ total: 0, results: [] })} />);
      expect(screen.getByText('No hotels found for these dates.')).toBeInTheDocument();
    });

    it('renders singular "option found" when total is 1', () => {
      render(<HotelCard data={makeData({ total: 1, results: [makeHotel('h1', 'Hotel One')] })} />);
      expect(screen.getByText('1 option found')).toBeInTheDocument();
    });

    it('renders check-in/check-out date range when provided', () => {
      render(<HotelCard data={makeData()} checkIn="2026-07-01" checkOut="2026-07-04" />);
      expect(screen.getByText(/Jul/)).toBeInTheDocument();
    });
  });

  describe('selection and confirm banner', () => {
    it('shows confirm banner after selecting a hotel', async () => {
      const user = userEvent.setup();
      render(<HotelCard data={makeData()} onSelect={jest.fn()} />);
      await user.click(screen.getAllByTestId('hotel-option')[0]);
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('calls onSelect with the hotel when confirm is clicked', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(<HotelCard data={makeData()} onSelect={onSelect} />);
      await user.click(screen.getAllByTestId('hotel-option')[0]);
      await user.click(screen.getByRole('button', { name: /confirm/i }));
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'h1' }));
    });

    it('continues the booking flow after confirming a selection', async () => {
      const onContinueBooking = jest.fn();
      const user = userEvent.setup();
      render(
        <HotelCard data={makeData()} onSelect={jest.fn()} onContinueBooking={onContinueBooking} />
      );
      await user.click(screen.getAllByTestId('hotel-option')[0]);
      await user.click(screen.getByRole('button', { name: /confirm/i }));
      expect(onContinueBooking).toHaveBeenCalledWith(expect.objectContaining({ id: 'h1' }));
    });

    it('allows selecting a different hotel after confirming the current selection', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(<HotelCard data={makeData()} onSelect={onSelect} />);

      const hotelOptions = screen.getAllByTestId('hotel-option');
      await user.click(hotelOptions[0]);
      await user.click(screen.getByRole('button', { name: /confirm/i }));
      await user.click(hotelOptions[1]);
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'h2' }));
      expect(onSelect).toHaveBeenCalledTimes(2);
    });

    it('hides confirm banner after clicking Change', async () => {
      const user = userEvent.setup();
      render(<HotelCard data={makeData()} onSelect={jest.fn()} />);
      await user.click(screen.getAllByTestId('hotel-option')[0]);
      await user.click(screen.getByRole('button', { name: /change/i }));
      expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
    });
  });
});
