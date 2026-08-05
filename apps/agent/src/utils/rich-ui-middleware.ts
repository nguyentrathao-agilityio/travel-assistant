import { ToolMessage } from 'langchain';
import { createMiddleware } from 'langchain';

// Schemas
import { ToolErrorSchema } from '@/schemas';

// Constants
import { TOOL_NAMES, TOOL_READY_OUTPUT, WRITE_TOOL_NAMES } from '@/constants';

const isErrorArtifact = (artifact: unknown): boolean =>
  typeof artifact === 'object' && artifact !== null && 'error' in artifact;

const recordOf = (artifact: unknown): Record<string, unknown> | undefined =>
  typeof artifact === 'object' && artifact !== null
    ? (artifact as Record<string, unknown>)
    : undefined;

export const buildRichUiToolSummary = (name: string | undefined, artifact: unknown): string => {
  const value = recordOf(artifact);
  const results = Array.isArray(value?.results) ? value.results.length : undefined;
  const count = typeof value?.count === 'number' ? value.count : results;
  const total = typeof value?.total === 'number' ? value.total : results;

  const fact =
    name === TOOL_NAMES.FLIGHTS
      ? `${count ?? 0} flight option(s) are available.`
      : name === TOOL_NAMES.HOTEL
        ? `${total ?? 0} hotel option(s) are available.`
        : name === TOOL_NAMES.PLACES
          ? `${total ?? 0} place(s) are available.`
          : name === TOOL_NAMES.LOCAL_TIPS
            ? `${count ?? 0} local tip(s) are available.`
            : name === TOOL_NAMES.ROUTE && Array.isArray(value?.stops)
              ? `A route with ${value.stops.length} stop(s) is available.`
              : name === TOOL_NAMES.WEATHER
                ? 'Weather conditions and forecast are available.'
                : name === TOOL_NAMES.DESTINATION_EXPLORER
                  ? 'A destination overview is available.'
                  : name === TOOL_NAMES.TRIP_SUMMARY
                    ? 'A structured trip summary is available.'
                    : name && WRITE_TOOL_NAMES.has(name)
                      ? 'The booking action result is available.'
                      : 'The result is available.';

  return `${fact} ${TOOL_READY_OUTPUT}`;
};

const freshToolMessageCutoff = (messages: readonly unknown[]): number => {
  let cutoff = messages.length;
  while (cutoff > 0 && messages[cutoff - 1] instanceof ToolMessage) cutoff -= 1;
  return cutoff;
};

const safeErrorContent = (artifact: unknown): string | undefined => {
  const parsed = ToolErrorSchema.safeParse(artifact);
  if (!parsed.success) return undefined;
  const action = parsed.data.retryable
    ? 'Tell the user they can try again; do not expose provider internals.'
    : 'Tell the user the operation cannot be retried automatically; do not expose provider internals.';
  return `The tool failed with ${parsed.data.code} from ${parsed.data.provider}. ${action}`;
};

// Collapse fresh rich-card content to avoid duplicate text responses.
// Preserve artifacts, older results, and errors for later agent steps.
export const richUiModelMiddleware = createMiddleware({
  name: 'RichUiModelContent',
  wrapModelCall: (request, handler) => {
    const cutoff = freshToolMessageCutoff(request.messages);
    return handler({
      ...request,
      messages: request.messages.map((message, index) => {
        if (!(index >= cutoff && message instanceof ToolMessage && message.artifact !== undefined))
          return message;
        const safeError = isErrorArtifact(message.artifact)
          ? safeErrorContent(message.artifact)
          : undefined;
        if (isErrorArtifact(message.artifact) && !safeError) return message;
        return new ToolMessage({
          id: message.id,
          content: safeError ?? buildRichUiToolSummary(message.name, message.artifact),
          tool_call_id: message.tool_call_id,
          name: message.name,
          status: message.status,
          artifact: message.artifact,
        });
      }),
    });
  },
});
