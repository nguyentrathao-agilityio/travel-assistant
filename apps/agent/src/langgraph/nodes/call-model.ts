import { SystemMessage } from '@langchain/core/messages';
import type { BindToolsInput } from '@langchain/core/language_models/chat_models';
import type { ChatOpenAI } from '@langchain/openai';

import { tools } from '../tools';
import type { GraphStateType } from '../state';
import { buildSystemPrompt } from '../utils';

export const createCallModelNode = (model: ChatOpenAI) => {
  return async (state: GraphStateType) => {
    const frontendTools = (state.tools ?? []) as BindToolsInput[];
    const modelWithTools = model.bindTools([...tools, ...frontendTools]);

    const response = await modelWithTools.invoke([
      new SystemMessage(buildSystemPrompt(state)),
      ...state.messages,
    ]);
    return { messages: [response] };
  };
};
