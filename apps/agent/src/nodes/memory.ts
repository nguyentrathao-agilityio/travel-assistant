import { SystemMessage } from '@langchain/core/messages';

import {
  EXTRACT_MEMORY_SYSTEM_PROMPT,
  MAX_EXTRACT_MEMORY_MESSAGES,
  OPENAI_API_KEY,
} from '../constants';
import { createChatModel } from '../llm';
import { memoryStore, saveMemory } from '../services';
import { MemoryExtractionSchema } from '../schemas/memory';
import type { GraphStateType } from '../state';

const extractionModel = createChatModel({ apiKey: OPENAI_API_KEY! }).withStructuredOutput(
  MemoryExtractionSchema
);

// Best-effort: extraction runs after the branch has already produced its response, so a failure
// here must never surface to the user — it only affects what gets remembered next time.
export const saveMemoryNode = async (state: GraphStateType): Promise<Partial<GraphStateType>> => {
  try {
    const recentMessages = state.messages.slice(-MAX_EXTRACT_MEMORY_MESSAGES);
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
