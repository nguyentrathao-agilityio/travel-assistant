import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.eval.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    fileParallelism: false,
    testTimeout: 60_000,
    env: {
      API_URL: 'http://localhost:4020',
    },
  },
});
