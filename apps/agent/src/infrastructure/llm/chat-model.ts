import { ChatOpenAI } from '@langchain/openai';

import { DEFAULT_MODEL } from '../../constants';

export type CreateChatModelParams = {
  apiKey: string;
  model?: string;
};

/** Builds a ChatOpenAI instance pinned to temperature 0 for deterministic tool selection and structured output. */
export const createChatModel = ({
  apiKey,
  model = DEFAULT_MODEL,
}: CreateChatModelParams): ChatOpenAI => new ChatOpenAI({ apiKey, model, temperature: 0 });
