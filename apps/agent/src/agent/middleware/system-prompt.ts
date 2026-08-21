import { dynamicSystemPromptMiddleware } from 'langchain';

import type { AgentPromptSections } from '@/prompts';
import { buildAgentSystemPrompt } from '@/prompts';
import { memoryStore } from '@/infrastructure/persistence';
import { searchMemories } from '@/services/memory';
import type { GraphStateType } from '@/state';

export const createSystemPromptMiddleware = (prompt: AgentPromptSections) =>
  dynamicSystemPromptMiddleware(async (state) => {
    const memories = prompt.includeMemoryContext ? await searchMemories(memoryStore) : [];

    return buildAgentSystemPrompt(state as unknown as GraphStateType, prompt, memories);
  });
