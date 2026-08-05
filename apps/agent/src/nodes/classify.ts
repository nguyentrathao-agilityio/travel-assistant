import { Command } from '@langchain/langgraph';
import { SystemMessage } from '@langchain/core/messages';

import { CLASSIFY_SYSTEM_PROMPT, MAX_CLASSIFY_MESSAGES, OPENAI_API_KEY } from '../constants';
import { createChatModel } from '../infrastructure/llm';
import { IntentClassificationSchema } from '../schemas/intent';
import type { GraphStateType } from '../state';
import { routeByIntent, type BranchName } from './routing';

const classifyModel = createChatModel({ apiKey: OPENAI_API_KEY! }).withStructuredOutput(
  IntentClassificationSchema
);

type ClassifyCommand = Command<never, Partial<GraphStateType>, BranchName>;

// Keep classification and branch selection traceable in one node.
export const classifyNode = async (state: GraphStateType): Promise<ClassifyCommand> => {
  const recentMessages = state.messages.slice(-MAX_CLASSIFY_MESSAGES);
  const result = await classifyModel.invoke(
    [new SystemMessage({ content: CLASSIFY_SYSTEM_PROMPT }), ...recentMessages],
    { metadata: { 'copilotkit:emit-messages': false } }
  );

  return new Command({
    update: { intent: result.intent, handoffTarget: undefined },
    goto: routeByIntent(result.intent),
  });
};
