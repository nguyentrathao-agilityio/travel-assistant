import { propagateAttributes } from '@langfuse/core';
import { CallbackHandler } from '@langfuse/langchain';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { mergeConfigs } from '@langchain/core/runnables';
import { NodeSDK } from '@opentelemetry/sdk-node';

import type { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { RunnableConfig } from '@langchain/core/runnables';

type Environment = Record<string, string | undefined>;
type HandlerFactory = () => BaseCallbackHandler;

const TRACE_TAGS = ['travel-agent'];

let tracingStarted = false;

const configured = (env: Environment): boolean =>
  Boolean(env.LANGFUSE_PUBLIC_KEY?.trim() && env.LANGFUSE_SECRET_KEY?.trim());

const startTracing = (env: Environment): void => {
  if (tracingStarted) return;

  const sdk = new NodeSDK({
    spanProcessors: [
      new LangfuseSpanProcessor({
        baseUrl: env.LANGFUSE_BASE_URL?.trim() || undefined,
        publicKey: env.LANGFUSE_PUBLIC_KEY?.trim(),
        secretKey: env.LANGFUSE_SECRET_KEY?.trim(),
      }),
    ],
  });
  const flushAndExit = (signal: NodeJS.Signals) => {
    void sdk.shutdown().finally(() => process.kill(process.pid, signal));
  };

  sdk.start();
  process.once('SIGTERM', flushAndExit);
  process.once('SIGINT', flushAndExit);
  tracingStarted = true;
};

const defaultHandlerFactory = (env: Environment): HandlerFactory => {
  startTracing(env);

  return () => new CallbackHandler();
};

// Propagates session attributes so nested runs keep the thread's session id while streaming.
export const withLangfuseTracing = <T>(
  config: RunnableConfig | undefined,
  runName: string,
  run: (config: RunnableConfig | undefined) => Promise<T>,
  env: Environment = process.env,
  createHandler?: HandlerFactory
): Promise<T> => {
  if (!configured(env)) return run(config);

  const threadId = config?.configurable?.thread_id;
  const sessionId = typeof threadId === 'string' ? threadId : undefined;
  const handler = (createHandler ?? defaultHandlerFactory(env))();
  const tracedConfig = mergeConfigs(config, { callbacks: [handler], runName, tags: TRACE_TAGS });

  return propagateAttributes({ sessionId, tags: TRACE_TAGS }, () => run(tracedConfig));
};
