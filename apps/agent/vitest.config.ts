import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**'],
    reporters: ['default', 'html'],
    outputFile: { html: './test-report/index.html' },
    env: {
      API_URL: 'http://localhost:4020',
    },
  },
  resolve: {
    alias: {
      '@langgraph': resolve(__dirname, 'src/langgraph'),
    },
  },
});
