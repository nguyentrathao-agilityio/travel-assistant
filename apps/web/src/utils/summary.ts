import { Hotel, SelectedFlight } from '@repo/types';
import { TripCostEstimate } from '../../../../packages/schemas/src/trip-summary';

/**
 * Adjusts a trip's cost estimate to reflect actual booked prices for flights and hotels.
 * If a flight or hotel has been booked, this function updates the corresponding
 * cost breakdown item and recalculates the grand total.
 *
 * @param {object} params - The function parameters.
 * @param {TripCostEstimate} params.costEstimate - The original cost estimate.
 * @param {number} params.days - The total number of days for the trip, used for hotel cost calculation.
 * @param {SelectedFlight} [params.bookedFlight] - The booked flight details, if any.
 * @param {Hotel} [params.bookedHotel] - The booked hotel details, if any.
 * @returns {TripCostEstimate} The adjusted cost estimate, or the original if no adjustments were made.
 */
export const replaceCostEstimateWithBookings = ({
  costEstimate,
  days,
  travelers,
  bookedFlight,
  bookedHotel,
}: {
  costEstimate: TripCostEstimate;
  days: number;
  travelers: number;
  bookedFlight?: SelectedFlight;
  bookedHotel?: Hotel;
}) => {
  if (!costEstimate) {
    return costEstimate;
  }

  // Start with the original grand total and a copy of the breakdown.
  let newGrandTotal = costEstimate.grandTotal;
  const newBreakdown = [...costEstimate.breakdown];

  // Adjust for booked flight:
  // If a departure flight has a price, find the flight item in the cost breakdown.
  if (bookedFlight?.departure?.price) {
    const flightIndex = newBreakdown.findIndex((item) =>
      item.label.toLowerCase().includes('flight')
    );

    // If found, update the grand total and the breakdown amount with the booked price.
    if (flightIndex !== -1) {
      const originalFlightCost = newBreakdown[flightIndex].amount ?? 0;
      const totalFlightCost = bookedFlight.departure.price + (bookedFlight.return?.price ?? 0);

      newGrandTotal = newGrandTotal - originalFlightCost + totalFlightCost;
      newBreakdown[flightIndex] = {
        ...newBreakdown[flightIndex],
        amount: totalFlightCost,
        note: `${travelers} x $${totalFlightCost}`,
      };
    }
  }

  // Adjust for booked hotel:
  // If a hotel has a price per night, find the hotel item in the cost breakdown.
  if (bookedHotel?.pricePerNight) {
    const hotelIndex = newBreakdown.findIndex((item) => item.label.toLowerCase().includes('hotel'));

    // If found, update the grand total and the breakdown amount with the total booked hotel cost.
    if (hotelIndex !== -1) {
      const originalHotelCost = newBreakdown[hotelIndex].amount ?? 0;
      const totalHotelCost = bookedHotel.pricePerNight * days;

      newGrandTotal = newGrandTotal - originalHotelCost + totalHotelCost;
      newBreakdown[hotelIndex] = {
        ...newBreakdown[hotelIndex],
        amount: totalHotelCost,
        note: `${days} night${days !== 1 ? 's' : ''} x $${bookedHotel.pricePerNight}/night`,
      };
    }
  }

  // Return the new cost estimate object with the updated grand total and breakdown.
  return {
    ...costEstimate,
    grandTotal: newGrandTotal,
    breakdown: newBreakdown,
  };
};
