import { openAIModerationMiddleware } from 'langchain';

// Constants
import { MODERATION_MODEL, MODERATION_VIOLATION_MESSAGE } from '@/constants';

type ModerationModel = Parameters<typeof openAIModerationMiddleware>[0]['model'];

export const createModerationMiddleware = (model: ModerationModel) =>
  openAIModerationMiddleware({
    model,
    moderationModel: MODERATION_MODEL,
    checkInput: true,
    checkOutput: true,
    checkToolResults: false,
    exitBehavior: 'end',
    violationMessage: MODERATION_VIOLATION_MESSAGE,
  });
