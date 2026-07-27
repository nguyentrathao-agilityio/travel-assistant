import { Command } from '@langchain/langgraph';
import { SystemMessage } from '@langchain/core/messages';

import {
  CLASSIFY_SYSTEM_PROMPT,
  FALLBACK_INTENT,
  MAX_CLASSIFY_MESSAGES,
  OPENAI_API_KEY,
} from '../constants';
import { createChatModel } from '../llm';
import { IntentClassificationSchema } from '../schemas/intent';
import type { GraphStateType } from '../state';
import { routeByIntent, type BranchName } from './routing';

const classifyModel = createChatModel({ apiKey: OPENAI_API_KEY! }).withStructuredOutput(
  IntentClassificationSchema
);

type ClassifyCommand = Command<never, Partial<GraphStateType>, BranchName>;

// Routes from inside the node (via Command.goto) rather than a separate addConditionalEdges
// router, so the classify → branch decision stays traceable in one place.
export const classifyNode = async (state: GraphStateType): Promise<ClassifyCommand> => {
  try {
    const recentMessages = state.messages.slice(-MAX_CLASSIFY_MESSAGES);
    const result = await classifyModel.invoke(
      [new SystemMessage({ content: CLASSIFY_SYSTEM_PROMPT }), ...recentMessages],
      { metadata: { 'copilotkit:emit-messages': false } }
    );

    return new Command({ update: { intent: result.intent }, goto: routeByIntent(result.intent) });
  } catch {
    return new Command({
      update: { intent: FALLBACK_INTENT },
      goto: routeByIntent(FALLBACK_INTENT),
    });
  }
};
