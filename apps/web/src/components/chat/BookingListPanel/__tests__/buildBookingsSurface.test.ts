import { basicCatalog } from '@copilotkit/a2ui-renderer';

import { BOOKINGS_SURFACE_ID, buildBookingsSurface } from '../buildBookingsSurface';

import type { Booking } from '@repo/types';

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

const hotelBooking: Booking = {
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

describe('buildBookingsSurface', () => {
  it('returns no messages for an empty booking list', () => {
    expect(buildBookingsSurface([])).toEqual([]);
  });

  it('creates a surface bound to the basic catalog', () => {
    const [createSurfaceMessage] = buildBookingsSurface([flightBooking]);

    expect(createSurfaceMessage).toEqual({
      version: 'v0.9',
      createSurface: { surfaceId: BOOKINGS_SURFACE_ID, catalogId: basicCatalog.id },
    });
  });

  it('binds one component-tree entry per booking in the data model', () => {
    const messages = buildBookingsSurface([flightBooking, hotelBooking]);
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
      {
        summary: 'Test Hotel, 2 nights',
        confirmationCode: 'XYZ789',
        priceFormatted: '$300',
        statusLabel: 'Cancelled',
      },
    ]);
  });
});
