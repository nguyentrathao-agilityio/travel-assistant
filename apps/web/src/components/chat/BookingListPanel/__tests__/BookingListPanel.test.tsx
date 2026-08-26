import { fireEvent, render, screen, within } from '@testing-library/react';

import { BookingListPanel } from '../index';

import type { Booking } from '@repo/types';

const mockUseTripState = jest.fn();
const mockProcessMessages = jest.fn();
const mockSendMessage = jest.fn();

jest.mock('@/hooks', () => ({ useTripState: () => mockUseTripState() }));

jest.mock('@/stores', () => ({
  useConversationRendererStore: (selector: (store: { sendMessage: jest.Mock }) => unknown) =>
    selector({ sendMessage: mockSendMessage }),
}));

jest.mock('@copilotkit/a2ui-renderer', () => ({
  basicCatalog: { id: 'https://a2ui.org/specification/v0_9/basic_catalog.json' },
  A2UIProvider: ({ children }: { children: React.ReactNode }) => children,
  A2UIRenderer: ({ surfaceId }: { surfaceId: string }) => (
    <div data-testid={`a2ui-surface-${surfaceId}`} />
  ),
  useA2UIActions: () => ({
    processMessages: mockProcessMessages,
    dispatch: jest.fn(),
    getSurface: jest.fn(),
    clearSurfaces: jest.fn(),
  }),
}));

const flightBooking: Booking = {
  id: 'booking-1',
  confirmationCode: 'ABC123',
  type: 'flight',
  referenceId: 'flight-1',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  totalPrice: 1200,
  currency: 'USD',
  status: 'confirmed',
  createdAt: '2026-08-01T00:00:00Z',
  summary: 'Flight SGN to HAN on Sep 10',
};

const cancelledHotelBooking: Booking = {
  id: 'booking-2',
  confirmationCode: 'XYZ789',
  type: 'hotel',
  referenceId: 'hotel-1',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  totalPrice: 300,
  currency: 'USD',
  status: 'cancelled',
  createdAt: '2026-08-01T00:00:00Z',
  summary: 'Test Hotel, 2 nights',
};

describe('BookingListPanel', () => {
  beforeEach(() => {
    mockProcessMessages.mockClear();
    mockSendMessage.mockClear();
  });

  it('renders nothing when closed', () => {
    mockUseTripState.mockReturnValue({ state: {} });

    const { container } = render(<BookingListPanel open={false} onClose={jest.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows an empty state when there are no confirmed bookings', () => {
    mockUseTripState.mockReturnValue({ state: {} });

    render(<BookingListPanel open onClose={jest.fn()} />);

    expect(screen.getByText('No confirmed bookings yet.')).toBeInTheDocument();
    expect(mockProcessMessages).not.toHaveBeenCalled();
  });

  it('pushes an A2UI surface built from the confirmed bookings', () => {
    mockUseTripState.mockReturnValue({ state: { flightBooking } });

    render(<BookingListPanel open onClose={jest.fn()} />);

    expect(mockProcessMessages).toHaveBeenCalledTimes(1);
    const [messages] = mockProcessMessages.mock.calls[0] as [Array<Record<string, unknown>>];
    const dataModelMessage = messages.find((message) => 'updateDataModel' in message) as {
      updateDataModel: { value: { bookings: Array<Record<string, unknown>> } };
    };

    expect(dataModelMessage.updateDataModel.value.bookings).toEqual([
      {
        summary: 'Flight SGN to HAN on Sep 10',
        confirmationCode: 'ABC123',
        priceFormatted: '$1,200',
        statusLabel: 'Confirmed',
      },
    ]);
  });

  it('sends a cancel message without closing the panel, so the status card can update live', () => {
    mockUseTripState.mockReturnValue({ state: { flightBooking } });
    const onClose = jest.fn();

    render(<BookingListPanel open onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel ABC123' }));

    expect(mockSendMessage).toHaveBeenCalledWith('Cancel booking ABC123.');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
  });

  it('places a compact cancel action inside the right side of its full-width A2UI ticket', () => {
    mockUseTripState.mockReturnValue({ state: { flightBooking } });

    render(<BookingListPanel open onClose={jest.fn()} />);

    const row = screen.getByRole('group', { name: 'Booking ABC123' });
    expect(row).toHaveClass('relative');
    const surface = within(row).getByTestId('a2ui-surface-bookings-list-booking-1');
    expect(surface.parentElement).toHaveClass('booking-ticket-surface');
    const cancelButton = within(row).getByRole('button', { name: 'Cancel ABC123' });
    expect(cancelButton).toHaveClass('absolute');
    expect(cancelButton).not.toHaveTextContent('Cancel');
    expect(cancelButton.querySelector('svg')).toHaveClass('lucide-circle-x');
    expect(cancelButton).toHaveAttribute('title', 'Cancel booking');
  });

  it('does not offer a cancel button for an already-cancelled booking', () => {
    mockUseTripState.mockReturnValue({ state: { hotelBooking: cancelledHotelBooking } });

    render(<BookingListPanel open onClose={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Cancel XYZ789' })).not.toBeInTheDocument();
  });

  it('re-pushes the A2UI surface once the booking status actually changes', () => {
    mockUseTripState.mockReturnValue({ state: { flightBooking } });
    const { rerender } = render(<BookingListPanel open onClose={jest.fn()} />);

    expect(mockProcessMessages).toHaveBeenCalledTimes(1);

    const cancelledFlightBooking: Booking = { ...flightBooking, status: 'cancelled' };
    mockUseTripState.mockReturnValue({ state: { flightBooking: cancelledFlightBooking } });
    rerender(<BookingListPanel open onClose={jest.fn()} />);

    expect(mockProcessMessages).toHaveBeenCalledTimes(2);
    const [messages] = mockProcessMessages.mock.calls[1] as [Array<Record<string, unknown>>];
    const dataModelMessage = messages.find((message) => 'updateDataModel' in message) as {
      updateDataModel: { value: { bookings: Array<{ statusLabel: string }> } };
    };

    expect(dataModelMessage.updateDataModel.value.bookings[0].statusLabel).toBe('Cancelled');
    expect(screen.queryByRole('button', { name: 'Cancel ABC123' })).not.toBeInTheDocument();
  });

  it('does not rebuild the A2UI surface on a re-render where the booking data is unchanged', () => {
    mockUseTripState.mockReturnValue({ state: { flightBooking } });
    const { rerender } = render(<BookingListPanel open onClose={jest.fn()} />);

    expect(mockProcessMessages).toHaveBeenCalledTimes(1);

    // Same booking object reference, but a new `state` object — simulates an
    // unrelated field syncing (e.g. destination), not a real booking change.
    mockUseTripState.mockReturnValue({ state: { flightBooking, destination: 'Hanoi' } });
    rerender(<BookingListPanel open onClose={jest.fn()} />);

    expect(mockProcessMessages).toHaveBeenCalledTimes(1);
  });

  it('does not offer an edit button for an already-cancelled booking', () => {
    mockUseTripState.mockReturnValue({ state: { hotelBooking: cancelledHotelBooking } });

    render(<BookingListPanel open onClose={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Edit XYZ789' })).not.toBeInTheDocument();
  });

  it('does not offer an edit button for a confirmed booking', () => {
    mockUseTripState.mockReturnValue({ state: { flightBooking } });

    render(<BookingListPanel open onClose={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Edit ABC123' })).not.toBeInTheDocument();
  });
});
