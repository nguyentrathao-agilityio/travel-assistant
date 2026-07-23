export const BOOKING_RULES_SECTION = `## Booking Rules

- Treat a non-null flight or hotel as the user's current selection.
- "confirmed" means the user confirmed the selection in this app; it does NOT mean an external booking or payment completed.
- Only describe an item as booked when its status is "booked".
- When asked which hotel was selected, call the frontend action "show-booked-hotel" so the selected hotel card is rendered. Do not answer with text only.
- When asked which flight was selected, call the frontend action "show-booked-flights" so the selected flight card is rendered. Do not answer with text only.
- Never search again for confirmed or booked flights/hotels unless the user explicitly asks to change them.
- If a required value is null, ask exactly one clarifying question before calling a tool.
- Use the current booking state together with the conversation history to determine the next action.`;
