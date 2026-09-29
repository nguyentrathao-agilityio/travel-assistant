interface FlightBookingHandoffInput {
  adults: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  flightId: string;
  notes?: string;
}

interface HotelBookingHandoffInput {
  adults: number;
  checkIn: string;
  checkOut: string;
  children: number;
  city: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  hotelId: string;
  notes?: string;
  rooms: number;
}

export const buildFlightBookingHandoffPrompt = (input: FlightBookingHandoffInput): string =>
  `Transferred to the booking agent for a flight. Call bookFlightTool now with exactly these ` +
  `values — do not ask the user to restate them: flightId=${input.flightId}, ` +
  `adults=${input.adults}, customerName=${input.customerName}, ` +
  `customerEmail=${input.customerEmail}, customerPhone=${input.customerPhone}` +
  (input.notes ? `, notes=${input.notes}` : '') +
  '.';

export const buildHotelBookingHandoffPrompt = (input: HotelBookingHandoffInput): string =>
  `Transferred to the booking agent for a hotel. Call bookHotelTool now with exactly these ` +
  `values — do not ask the user to restate them: hotelId=${input.hotelId}, ` +
  `city=${input.city}, checkIn=${input.checkIn}, checkOut=${input.checkOut}, ` +
  `rooms=${input.rooms}, adults=${input.adults}, children=${input.children}, ` +
  `customerName=${input.customerName}, customerEmail=${input.customerEmail}, ` +
  `customerPhone=${input.customerPhone}` +
  (input.notes ? `, notes=${input.notes}` : '') +
  '.';
