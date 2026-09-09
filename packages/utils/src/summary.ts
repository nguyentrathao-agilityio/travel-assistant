import type { TripCostEstimate } from '@repo/schemas';
import type { Hotel, SelectedFlight } from '@repo/types';

interface ReplaceCostEstimateParams {
  costEstimate: TripCostEstimate;
  days: number;
  travelers: number;
  bookedFlight?: SelectedFlight;
  bookedHotel?: Hotel;
}

export const replaceCostEstimateWithBookings = ({
  costEstimate,
  days,
  travelers,
  bookedFlight,
  bookedHotel,
}: ReplaceCostEstimateParams): TripCostEstimate => {
  let grandTotal = costEstimate.grandTotal;
  const breakdown = [...costEstimate.breakdown];

  if (bookedFlight?.departure?.price) {
    const flightIndex = breakdown.findIndex((item) => item.label.toLowerCase().includes('flight'));

    if (flightIndex !== -1) {
      const originalFlightCost = breakdown[flightIndex].amount ?? 0;
      const totalFlightCost = bookedFlight.departure.price + (bookedFlight.return?.price ?? 0);

      grandTotal = grandTotal - originalFlightCost + totalFlightCost;
      breakdown[flightIndex] = {
        ...breakdown[flightIndex],
        amount: totalFlightCost,
        note: `${travelers} x $${totalFlightCost}`,
      };
    }
  }

  if (bookedHotel?.pricePerNight) {
    const hotelIndex = breakdown.findIndex((item) => item.label.toLowerCase().includes('hotel'));

    if (hotelIndex !== -1) {
      const originalHotelCost = breakdown[hotelIndex].amount ?? 0;
      const totalHotelCost = bookedHotel.pricePerNight * days;

      grandTotal = grandTotal - originalHotelCost + totalHotelCost;
      breakdown[hotelIndex] = {
        ...breakdown[hotelIndex],
        amount: totalHotelCost,
        note: `${days} night${days !== 1 ? 's' : ''} x $${bookedHotel.pricePerNight}/night`,
      };
    }
  }

  return { ...costEstimate, grandTotal, breakdown };
};
