import { tool } from '@langchain/core/tools';
import type { ToolRuntime } from '@langchain/core/tools';
import { AIMessage, ToolMessage } from '@langchain/core/messages';
import { Command } from '@langchain/langgraph';

import { FlightBookingInputSchema, HotelBookingInputSchema } from '../schemas';
import type { GraphStateType } from '../state';

// Per LangChain's multi-agent handoffs guide: pass only the AIMessage that made this call plus a
// ToolMessage acknowledging it — never the full subgraph history — to avoid confusing the
// receiving branch or bloating its context. The receiving branch has no other way to see the
// booking details than this ToolMessage's content, so it restates them directly.
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
      goto: 'bookFlight',
      graph: Command.PARENT,
      update: {
        messages: buildHandoffMessages(
          runtime,
          `Transferred to the flight booking agent. Call bookFlightTool now with exactly these ` +
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
    description: `Hand off to the flight booking agent. Call this instead of trying to book
yourself as soon as, within this same message, the user has both picked one exact flight from
search results and given passenger name, email, and phone. Do not use this just to search or
compare flights — flightsTool already covers that.`,
    schema: FlightBookingInputSchema,
  }
);

export const transferToBookHotelTool = tool(
  async (input, runtime: ToolRuntime<GraphStateType>) =>
    new Command({
      goto: 'bookHotel',
      graph: Command.PARENT,
      update: {
        messages: buildHandoffMessages(
          runtime,
          `Transferred to the hotel booking agent. Call bookHotelTool now with exactly these ` +
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
    description: `Hand off to the hotel booking agent. Call this instead of trying to book
    yourself as soon as, within this same message, the user has both picked one exact hotel from
    search results and given stay dates, party size, guest name, email, and phone. Do not use this
    just to search or compare hotels — hotelTool already covers that.`,
    schema: HotelBookingInputSchema,
  }
);
