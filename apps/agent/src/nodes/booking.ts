import { AIMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';

// Constants
import { AGENT_CONFIGS } from '@/constants/agent-config';
import { BOOKING_OPERATIONS, DOMAIN_NODE_NAME } from '@/constants';
import { BOOKING_STATUSES } from '@repo/constants';

// Infrastructure
import { createSpecializedAgent } from '@/agent/create-agent';
import { openAiApiKeyFromConfig, withOpenAiApiKey } from '@/infrastructure/llm';
import { withLangfuseTracing } from '@/infrastructure/observability';

// State
import type { GraphStateType, GraphStateUpdate } from '@/state';

export const createBookingAgent = (apiKey: string) =>
  createSpecializedAgent(AGENT_CONFIGS.booking, apiKey);

const activeBookingForOperation = (state: GraphStateType) => {
  const booking =
    state.bookingOperation === BOOKING_OPERATIONS.FLIGHT
      ? state.flightBooking
      : state.bookingOperation === BOOKING_OPERATIONS.HOTEL
        ? state.hotelBooking
        : undefined;

  return booking?.status === BOOKING_STATUSES.CONFIRMED ? booking : undefined;
};

const blockedBookingResponse = (
  booking: NonNullable<ReturnType<typeof activeBookingForOperation>>
): GraphStateUpdate => ({
  messages: [
    new AIMessage(
      `You already have an active ${booking.type} booking (${booking.confirmationCode}). ` +
        'Please cancel it before creating a replacement booking.'
    ),
  ],
  execution: {
    currentNode: DOMAIN_NODE_NAME.BOOKING,
    completedTasks: [DOMAIN_NODE_NAME.BOOKING],
  },
});

export const bookingAgent = (state: GraphStateType, config?: RunnableConfig) => {
  const activeBooking = activeBookingForOperation(state);

  if (activeBooking) return blockedBookingResponse(activeBooking);

  const apiKey = openAiApiKeyFromConfig(config);

  return withOpenAiApiKey(apiKey, () =>
    withLangfuseTracing(config, 'booking-agent', (tracedConfig) =>
      createBookingAgent(apiKey).invoke(state, tracedConfig)
    )
  );
};
