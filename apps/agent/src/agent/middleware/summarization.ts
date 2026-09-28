import { summarizationMiddleware } from 'langchain';

import { SUMMARY_MESSAGE_PREFIX } from '@repo/constants';

// Constants
import {
  SUMMARIZATION_KEEP_MESSAGES,
  SUMMARIZATION_TRIGGER_CONTEXT_FRACTION,
  SUMMARIZATION_TRIGGER_MESSAGES,
} from '@/constants';

type SummarizationModel = Parameters<typeof summarizationMiddleware>[0]['model'];

// Trigger conditions are OR'ed: compact at 75% of the model's context window or at 20 messages.
export const createSummarizationMiddleware = (model: SummarizationModel) =>
  summarizationMiddleware({
    model,
    trigger: [
      { fraction: SUMMARIZATION_TRIGGER_CONTEXT_FRACTION },
      { messages: SUMMARIZATION_TRIGGER_MESSAGES },
    ],
    keep: { messages: SUMMARIZATION_KEEP_MESSAGES },
    summaryPrefix: SUMMARY_MESSAGE_PREFIX,
  });
