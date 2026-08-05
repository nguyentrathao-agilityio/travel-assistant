import { SystemMessage, ToolMessage } from '@langchain/core/messages';

// Schemas
import { MemoryExtractionSchema } from '@/schemas/memory';

// Constants
import {
  BOOKING_TOOL_NAMES,
  EXTRACT_MEMORY_SYSTEM_PROMPT,
  MAX_EXTRACT_MEMORY_MESSAGES,
  OPENAI_API_KEY,
} from '@/constants';

// Services
import { saveMemory } from '@/services/memory';

// Infrastructure
import { createChatModel } from '@/infrastructure/llm';
import { memoryStore } from '@/infrastructure/persistence';

// State
import type { GraphStateType } from '@/state';

// Utils
import { takeRecentMessages } from '@/utils';

const extractionModel = createChatModel({ apiKey: OPENAI_API_KEY! }).withStructuredOutput(
  MemoryExtractionSchema
);

const isBookingToolMessage = (message: GraphStateType['messages'][number]): boolean =>
  message instanceof ToolMessage && BOOKING_TOOL_NAMES.includes(message.name ?? '');

// Best-effort: extraction runs after the branch has already produced its response, so a failure
// here must never surface to the user — it only affects what gets remembered next time.
export const saveMemoryNode = async (state: GraphStateType): Promise<Partial<GraphStateType>> => {
  try {
    const recentMessages = takeRecentMessages(state.messages, MAX_EXTRACT_MEMORY_MESSAGES);
    // Booking tool messages carry the customer's name/email/phone — skip extraction entirely
    // rather than risk the model pulling that PII into long-term memory.
    if (recentMessages.some(isBookingToolMessage)) return {};

    const result = await extractionModel.invoke(
      [new SystemMessage({ content: EXTRACT_MEMORY_SYSTEM_PROMPT }), ...recentMessages],
      { metadata: { 'copilotkit:emit-messages': false } }
    );

    if (result.memory && result.memory !== 'null') await saveMemory(memoryStore, result.memory);
  } catch (error) {
    console.warn('[memory] Failed to extract or save long-term memory', error);
  }

  return {};
};
