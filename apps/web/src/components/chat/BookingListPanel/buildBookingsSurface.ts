import { basicCatalog } from '@copilotkit/a2ui-renderer';

import { BOOKING_STATUSES } from '@repo/constants';
import { formatPrice } from '@/utils';

import type { Booking } from '@repo/types';

export const BOOKINGS_SURFACE_ID = 'bookings-list';

const bookingItemComponents = (index: number) => {
  const summaryId = `booking-${index}-summary`;
  const codeLabelId = `booking-${index}-code-label`;
  const codeValueId = `booking-${index}-code-value`;
  const codeColId = `booking-${index}-code-col`;
  const priceLabelId = `booking-${index}-price-label`;
  const priceValueId = `booking-${index}-price-value`;
  const priceColId = `booking-${index}-price-col`;
  const statusLabelId = `booking-${index}-status-label`;
  const statusValueId = `booking-${index}-status-value`;
  const statusColId = `booking-${index}-status-col`;
  const detailsRowId = `booking-${index}-details-row`;
  const cardColId = `booking-${index}-col`;
  const cardId = `booking-${index}`;

  return [
    { id: cardId, component: 'Card', child: cardColId },
    {
      id: cardColId,
      component: 'Column',
      children: [summaryId, detailsRowId],
      align: 'stretch',
    },
    {
      id: summaryId,
      component: 'Text',
      text: { path: `/bookings/${index}/summary` },
      variant: 'body',
    },
    {
      id: detailsRowId,
      component: 'Row',
      children: [codeColId, priceColId, statusColId],
      justify: 'spaceBetween',
    },
    { id: codeColId, component: 'Column', children: [codeLabelId, codeValueId], align: 'start' },
    { id: codeLabelId, component: 'Text', text: 'Confirmation', variant: 'caption' },
    {
      id: codeValueId,
      component: 'Text',
      text: { path: `/bookings/${index}/confirmationCode` },
      variant: 'body',
    },
    {
      id: priceColId,
      component: 'Column',
      children: [priceLabelId, priceValueId],
      align: 'center',
    },
    { id: priceLabelId, component: 'Text', text: 'Total', variant: 'caption' },
    {
      id: priceValueId,
      component: 'Text',
      text: { path: `/bookings/${index}/priceFormatted` },
      variant: 'body',
    },
    {
      id: statusColId,
      component: 'Column',
      children: [statusLabelId, statusValueId],
      align: 'end',
    },
    { id: statusLabelId, component: 'Text', text: 'Status', variant: 'caption' },
    {
      id: statusValueId,
      component: 'Text',
      text: { path: `/bookings/${index}/statusLabel` },
      variant: 'body',
    },
  ];
};

const statusLabel = (status: Booking['status']): string =>
  status === BOOKING_STATUSES.CANCELLED ? 'Cancelled' : 'Confirmed';

/** Builds a local (non-agent-emitted) A2UI surface listing already-known confirmed bookings. */
export const buildBookingsSurface = (bookings: Booking[]): Record<string, unknown>[] => {
  if (bookings.length === 0) return [];

  const rootChildren = bookings.map((_, index) => `booking-${index}`);
  const components = [
    { id: 'root', component: 'Column', children: rootChildren, align: 'stretch' },
    ...bookings.flatMap((_, index) => bookingItemComponents(index)),
  ];
  const dataModel = {
    bookings: bookings.map((booking) => ({
      summary: booking.summary,
      confirmationCode: booking.confirmationCode,
      priceFormatted: formatPrice(booking.totalPrice, booking.currency),
      statusLabel: statusLabel(booking.status),
    })),
  };

  return [
    {
      version: 'v0.9',
      createSurface: { surfaceId: BOOKINGS_SURFACE_ID, catalogId: basicCatalog.id },
    },
    { version: 'v0.9', updateComponents: { surfaceId: BOOKINGS_SURFACE_ID, components } },
    { version: 'v0.9', updateDataModel: { surfaceId: BOOKINGS_SURFACE_ID, value: dataModel } },
  ];
};
