import { getConfig } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';
import { dynamicSystemPromptMiddleware } from 'langchain';

import type { AgentPromptSections } from '@/prompts';
import { buildAgentSystemPrompt } from '@/prompts';
import { memoryStore } from '@/infrastructure/persistence';
import { searchMemories } from '@/services/memory';
import type { GraphStateType } from '@/state';

export const isVoiceModeConfig = (config: RunnableConfig | undefined): boolean =>
  config?.configurable?.voiceMode === true;

const currentRunIsVoiceMode = (): boolean => {
  try {
    return isVoiceModeConfig(getConfig());
  } catch {
    return false;
  }
};

export const createSystemPromptMiddleware = (prompt: AgentPromptSections) =>
  dynamicSystemPromptMiddleware(async (state) => {
    const memories = prompt.includeMemoryContext ? await searchMemories(memoryStore) : [];

    return buildAgentSystemPrompt(state as unknown as GraphStateType, prompt, memories, {
      voiceMode: currentRunIsVoiceMode(),
    });
  });
