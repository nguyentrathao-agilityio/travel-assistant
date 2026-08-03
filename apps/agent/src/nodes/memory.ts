import { SystemMessage, ToolMessage } from '@langchain/core/messages';

import {
  BOOKING_TOOL_NAMES,
  EXTRACT_MEMORY_SYSTEM_PROMPT,
  MAX_EXTRACT_MEMORY_MESSAGES,
  OPENAI_API_KEY,
} from '../constants';
import { createChatModel } from '../infrastructure/llm';
import { memoryStore } from '../infrastructure/persistence';
import { saveMemory } from '../services/memory';
import { MemoryExtractionSchema } from '../schemas/memory';
import type { GraphStateType } from '../state';

const extractionModel = createChatModel({ apiKey: OPENAI_API_KEY! }).withStructuredOutput(
  MemoryExtractionSchema
);

const isBookingToolMessage = (message: GraphStateType['messages'][number]): boolean =>
  message instanceof ToolMessage && BOOKING_TOOL_NAMES.includes(message.name ?? '');

// Best-effort: extraction runs after the branch has already produced its response, so a failure
// here must never surface to the user — it only affects what gets remembered next time.
export const saveMemoryNode = async (state: GraphStateType): Promise<Partial<GraphStateType>> => {
  try {
    const recentMessages = state.messages.slice(-MAX_EXTRACT_MEMORY_MESSAGES);
    if (recentMessages.some(isBookingToolMessage)) return {};

    const result = await extractionModel.invoke(
      [new SystemMessage({ content: EXTRACT_MEMORY_SYSTEM_PROMPT }), ...recentMessages],
      { metadata: { 'copilotkit:emit-messages': false } }
    );

    if (result.memory && result.memory !== 'null') await saveMemory(memoryStore, result.memory);
  } catch {
    // ignore — see comment above
  }

  return {};
};
