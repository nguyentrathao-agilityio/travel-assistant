import { SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';

// Schemas
import { MemoryExtractionSchema } from '@/schemas';

// Constants
import { isBookingToolName, MAX_EXTRACT_MEMORY_MESSAGES } from '@/constants';

// Services
import { saveMemory } from '@/services/memory';

// Infrastructure
import { createChatModel, openAiApiKeyFromConfig } from '@/infrastructure/llm';
import { memoryStore } from '@/infrastructure/persistence';

// Prompts
import { EXTRACT_MEMORY_SYSTEM_PROMPT } from '@/prompts';

// State
import type { GraphStateType } from '@/state';

// Utils
import { takeRecentMessages } from '@/utils';

const isBookingToolMessage = (message: GraphStateType['messages'][number]): boolean =>
  message instanceof ToolMessage && isBookingToolName(message.name ?? '');

/**
 * Extracts durable facts from the latest turn and persists them to long-term memory.
 * Best-effort: runs after the branch has already produced its response, so a failure
 * here must never surface to the user — it only affects what gets remembered next time.
 */
export const saveMemoryNode = async (
  state: GraphStateType,
  config?: RunnableConfig
): Promise<Partial<GraphStateType>> => {
  try {
    const recentMessages = takeRecentMessages(state.messages, MAX_EXTRACT_MEMORY_MESSAGES);

    if (recentMessages.some(isBookingToolMessage)) return {};

    const extractionModel = createChatModel({
      apiKey: openAiApiKeyFromConfig(config),
    }).withStructuredOutput(MemoryExtractionSchema);

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
