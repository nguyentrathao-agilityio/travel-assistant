import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';

export const API_URL = process.env.API_URL ?? 'http://localhost:4020';

export function createMswServer() {
  const server = setupServer();
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  return server;
}
