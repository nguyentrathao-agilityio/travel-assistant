import { AIMessage, ToolMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import type { ToolRuntime } from '@langchain/core/tools';
import { Command } from '@langchain/langgraph';

// Constants
import { BOOKING_OPERATIONS, DOMAIN_NODE_NAME } from '@/constants';

// Schemas
import { FlightBookingInputSchema, HotelBookingInputSchema } from '@/schemas';

// State
import type { GraphStateType } from '@/state';

// Pass only the handoff call and booking details to keep the next agent's context focused.
const buildHandoffMessages = (
  runtime: ToolRuntime<GraphStateType>,
  instruction: string
): (AIMessage | ToolMessage)[] => {
  const lastMessage = runtime.state.messages.at(-1);
  const lastAiMessage = lastMessage instanceof AIMessage ? [lastMessage] : [];
  const transferMessage = new ToolMessage({
    content: instruction,
    tool_call_id: runtime.toolCallId,
  });

  return [...lastAiMessage, transferMessage];
};

export const transferToBookFlightTool = tool(
  async (input, runtime: ToolRuntime<GraphStateType>) =>
    new Command({
      update: {
        bookingOperation: BOOKING_OPERATIONS.FLIGHT,
        handoffTarget: DOMAIN_NODE_NAME.BOOKING,
        messages: buildHandoffMessages(
          runtime,
          `Transferred to the booking agent for a flight. Call bookFlightTool now with exactly these ` +
            `values — do not ask the user to restate them: flightId=${input.flightId}, ` +
            `adults=${input.adults}, customerName=${input.customerName}, ` +
            `customerEmail=${input.customerEmail}, customerPhone=${input.customerPhone}` +
            (input.notes ? `, notes=${input.notes}` : '') +
            '.'
        ),
      },
    }),
  {
    name: 'transferToBookFlightTool',
    description: `Hand off to the booking agent for a flight. Call this instead of trying to book
    yourself as soon as, within this same message, the user has both picked one exact flight from
    search results and given passenger name, email, and phone. Do not use this just to search or
    compare flights — flightsTool already covers that.`,
    schema: FlightBookingInputSchema,
  }
);

export const transferToBookHotelTool = tool(
  async (input, runtime: ToolRuntime<GraphStateType>) =>
    new Command({
      update: {
        bookingOperation: BOOKING_OPERATIONS.HOTEL,
        handoffTarget: DOMAIN_NODE_NAME.BOOKING,
        messages: buildHandoffMessages(
          runtime,
          `Transferred to the booking agent for a hotel. Call bookHotelTool now with exactly these ` +
            `values — do not ask the user to restate them: hotelId=${input.hotelId}, ` +
            `city=${input.city}, checkIn=${input.checkIn}, checkOut=${input.checkOut}, ` +
            `rooms=${input.rooms}, adults=${input.adults}, children=${input.children}, ` +
            `customerName=${input.customerName}, customerEmail=${input.customerEmail}, ` +
            `customerPhone=${input.customerPhone}` +
            (input.notes ? `, notes=${input.notes}` : '') +
            '.'
        ),
      },
    }),
  {
    name: 'transferToBookHotelTool',
    description: `Hand off to the booking agent for a hotel. Call this instead of trying to book
    yourself as soon as, within this same message, the user has both picked one exact hotel from
    search results and given stay dates, party size, guest name, email, and phone. Do not use this
    just to search or compare hotels — hotelTool already covers that.`,
    schema: HotelBookingInputSchema,
  }
);
