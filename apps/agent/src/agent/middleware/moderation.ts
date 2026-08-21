import { openAIModerationMiddleware } from 'langchain';

type ModerationModel = Parameters<typeof openAIModerationMiddleware>[0]['model'];

export const createModerationMiddleware = (model: ModerationModel) =>
  openAIModerationMiddleware({
    model,
    moderationModel: 'omni-moderation-latest',
    checkInput: true,
    checkOutput: true,
    checkToolResults: false,
    exitBehavior: 'end',
    violationMessage: "I can't help with that request.",
  });
