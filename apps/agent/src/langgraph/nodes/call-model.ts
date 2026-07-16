import { SystemMessage } from '@langchain/core/messages';
import type { ChatOpenAI } from '@langchain/openai';

import { tools } from '../tools';
import type { GraphStateType } from '../state';
import { SYSTEM_PROMPT } from '../constants';

export const createCallModelNode = (model: ChatOpenAI) => {
  const modelWithTools = model.bindTools(tools);

  return async (state: GraphStateType) => {
    const response = await modelWithTools.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      ...state.messages,
    ]);
    return { messages: [response] };
  };
};
