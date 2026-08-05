import type {
  CopilotRuntimeHooks,
  HookContext,
  HandlerHookContext,
  ResponseHookContext,
  ErrorHookContext,
} from '@copilotkit/runtime/v2';

const REQUEST_START_HEADER_NAME = 'x-cpk-request-start';
const HTTP_STATUS_BAD_REQUEST = 400;
const UNREGISTERED_AGENT_ERROR_CODE = 'invalid_request';

/** Creates logging hooks and rejects requests for unknown agents. */
export const createCopilotKitHooks = (
  registeredAgentIds: readonly string[]
): CopilotRuntimeHooks => ({
  onRequest: stampRequestStart,
  onBeforeHandler: (ctx) => rejectUnregisteredAgent(ctx, registeredAgentIds),
  onResponse: logResponse,
  onError: logError,
});

/** Stamps the request start time for duration logging. */
const stampRequestStart = ({ request, path }: HookContext): Request => {
  console.log(`[copilotkit] -> ${request.method} ${path}`);
  const headers = new Headers(request.headers);
  headers.set(REQUEST_START_HEADER_NAME, Date.now().toString());

  return new Request(request, { headers });
};

/** Rejects agent operations targeting an unknown ID. */
const rejectUnregisteredAgent = (
  { route }: HandlerHookContext,
  registeredAgentIds: readonly string[]
): void => {
  const hasAgentId =
    route.method === 'agent/run' ||
    route.method === 'agent/connect' ||
    route.method === 'agent/stop';
  if (!hasAgentId || registeredAgentIds.includes(route.agentId)) return;

  throw new Response(
    JSON.stringify({
      error: UNREGISTERED_AGENT_ERROR_CODE,
      message: `Unknown agentId '${route.agentId}'`,
    }),
    { status: HTTP_STATUS_BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
  );
};

/** Logs response status and duration. */
const logResponse = ({ request, response, route }: ResponseHookContext): void => {
  console.log(
    `[copilotkit] <- ${request.method} ${new URL(request.url).pathname} (${route.method}) -> ${response.status} ${elapsedMs(request)}ms`
  );
};

/** Logs unhandled runtime errors. */
const logError = ({ request, error, path, route }: ErrorHookContext): void => {
  console.error(
    `[copilotkit] x ${request.method} ${path} (${route?.method ?? 'unresolved'}) failed after ${elapsedMs(request)}ms`,
    error
  );
};

const elapsedMs = (request: Request): number => {
  const startedAt = Number(request.headers.get(REQUEST_START_HEADER_NAME));

  return Number.isFinite(startedAt) ? Date.now() - startedAt : 0;
};
