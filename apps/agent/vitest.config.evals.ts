import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.eval.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    fileParallelism: false,
    testTimeout: 60_000,
    reporters: ['default', 'langsmith/vitest/reporter'],
    env: {
      API_URL: 'http://localhost:4020',
    },
  },
});
