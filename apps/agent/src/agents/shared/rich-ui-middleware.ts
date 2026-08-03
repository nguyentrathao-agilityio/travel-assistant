import { ToolMessage } from 'langchain';
import { createMiddleware } from 'langchain';

import { TOOL_READY_OUTPUT } from '../../constants';

const isErrorArtifact = (artifact: unknown): boolean =>
  typeof artifact === 'object' && artifact !== null && 'error' in artifact;

const freshToolMessageCutoff = (messages: readonly unknown[]): number => {
  let cutoff = messages.length;
  while (cutoff > 0 && messages[cutoff - 1] instanceof ToolMessage) cutoff -= 1;
  return cutoff;
};

export const richUiModelMiddleware = createMiddleware({
  name: 'RichUiModelContent',
  wrapModelCall: (request, handler) => {
    const cutoff = freshToolMessageCutoff(request.messages);
    return handler({
      ...request,
      messages: request.messages.map((message, index) =>
        index >= cutoff &&
        message instanceof ToolMessage &&
        message.artifact !== undefined &&
        !isErrorArtifact(message.artifact)
          ? new ToolMessage({
              id: message.id,
              content: TOOL_READY_OUTPUT,
              tool_call_id: message.tool_call_id,
              name: message.name,
              status: message.status,
              artifact: message.artifact,
            })
          : message
      ),
    });
  },
});
