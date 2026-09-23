import { summarizationMiddleware } from 'langchain';

// Constants
import { SUMMARIZATION_KEEP_MESSAGES, SUMMARIZATION_TRIGGER_MESSAGES } from '@/constants';

type SummarizationModel = Parameters<typeof summarizationMiddleware>[0]['model'];

export const createSummarizationMiddleware = (model: SummarizationModel) =>
  summarizationMiddleware({
    model,
    trigger: { messages: SUMMARIZATION_TRIGGER_MESSAGES },
    keep: { messages: SUMMARIZATION_KEEP_MESSAGES },
  });
