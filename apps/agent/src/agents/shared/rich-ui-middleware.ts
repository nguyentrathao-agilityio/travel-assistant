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

// Rich-card tool results (flights, hotels, weather, etc.) are already rendered on the frontend
// from `artifact` — collapsing `content` to a generic prompt for the freshest run of tool calls
// stops the model from repeating that data back in text, without discarding `artifact`. Only
// messages after the last AI reaction are "fresh"; older ones are left untouched so a later
// agent can still read the real data (e.g. a flight ID for a booking handoff), and error
// artifacts are always left untouched so the model still sees and can react to the failure.
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
