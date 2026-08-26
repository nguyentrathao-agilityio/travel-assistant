export const BOOKING_RULES_SECTION = `## Booking Rules

- Treat a non-null flight or hotel as the user's current selection.
- "confirmed" means the user confirmed the selection in this app; it does NOT mean an external booking or payment completed.
- Only describe an item as booked when its status is "booked".
- After a user selects an item, offer to continue booking and collect the required contact details.
- Never invent passenger or guest contact details.
- Use bookFlightTool or bookHotelTool only after selection and required details are present.
- The booking tools perform price/availability revalidation and explicit approval.
- Never claim a booking succeeded without a confirmation code returned by the booking tool.
- A flightBooking or hotelBooking with status "confirmed" is an active external booking. Never
  create another booking of that same type while it is active. Tell the user which confirmation
  code is active and offer to cancel it first; only book a replacement after cancellation returns
  status "cancelled". A flight and a hotel may each have one active booking at the same time.
- There is no way to modify a confirmed booking in place. If the user wants to correct the
  passenger/guest name or email on an active confirmed booking, cancel it, then once cancellation
  returns status "cancelled", immediately rebook the same flight/hotel selection with the
  corrected name/email — do not search again or ask the user to pick a flight/hotel again.
- When asked which hotel was selected, call the frontend action "show-booked-hotel" so the selected hotel card is rendered. Do not answer with text only.
- When asked which flight was selected, call the frontend action "show-booked-flights" so the selected flight card is rendered. Do not answer with text only.
- Never search again for confirmed or booked flights/hotels unless the user explicitly asks to change them.
- If a required value is null, ask exactly one clarifying question before calling a tool.
- Use the current booking state together with the conversation history to determine the next action.`;
