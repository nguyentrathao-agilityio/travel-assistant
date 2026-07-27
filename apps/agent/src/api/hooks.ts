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

/**
 * Builds CopilotKit lifecycle hooks: request/response logging with duration,
 * rejection of unregistered agentIds, and centralized error logging.
 *
 * @param registeredAgentIds - Agent ids registered on the CopilotRuntime; agent/run,
 *   agent/connect, and agent/stop requests for any other id are rejected with a 400
 *   before reaching the handler.
 */
export const createCopilotKitHooks = (
  registeredAgentIds: readonly string[]
): CopilotRuntimeHooks => ({
  onRequest: stampRequestStart,
  onBeforeHandler: (ctx) => rejectUnregisteredAgent(ctx, registeredAgentIds),
  onResponse: logResponse,
  onError: logError,
});

/** Logs request arrival and stamps a start-time header so later hooks can compute duration. */
const stampRequestStart = ({ request, path }: HookContext): Request => {
  console.log(`[copilotkit] -> ${request.method} ${path}`);
  const headers = new Headers(request.headers);
  headers.set(REQUEST_START_HEADER_NAME, Date.now().toString());

  return new Request(request, { headers });
};

/** Rejects agent/run, agent/connect, agent/stop requests targeting an unknown agentId. */
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

/** Logs method, path, resolved route, response status, and duration for every request. */
const logResponse = ({ request, response, route }: ResponseHookContext): void => {
  console.log(
    `[copilotkit] <- ${request.method} ${new URL(request.url).pathname} (${route.method}) -> ${response.status} ${elapsedMs(request)}ms`
  );
};

/** Logs context for any error the runtime couldn't handle before the default 500 response fires. */
const logError = ({ request, error, path, route }: ErrorHookContext): void => {
  console.error(
    `[copilotkit] x ${request.method} ${path} (${route?.method ?? 'unresolved'}) failed after ${elapsedMs(request)}ms`,
    error
  );
};

/** Reads the start-of-request timestamp stamped by `stampRequestStart`. */
const elapsedMs = (request: Request): number => {
  const startedAt = Number(request.headers.get(REQUEST_START_HEADER_NAME));

  return Number.isFinite(startedAt) ? Date.now() - startedAt : 0;
};
