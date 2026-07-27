import { ChatOpenAI } from '@langchain/openai';

import { DEFAULT_MODEL } from '../constants';

export type CreateChatModelParams = {
  apiKey: string;
  model?: string;
};

// Create a new instance of ChatOpenAI with the provided API key and model.
export const createChatModel = ({
  apiKey,
  model = DEFAULT_MODEL,
}: CreateChatModelParams): ChatOpenAI => new ChatOpenAI({ apiKey, model, temperature: 0 });
