import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './src/test/globalSetup.ts',
    reporters: ['default', 'html'],
    outputFile: { html: './test-report/index.html' },
    env: {
      API_URL: 'http://localhost:4020',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/mastra'),
    },
  },
});
