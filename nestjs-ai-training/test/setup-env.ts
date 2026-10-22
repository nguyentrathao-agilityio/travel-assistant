import { existsSync } from 'node:fs';

// Runs in every e2e worker before the tests. Real secrets come from the
// environment (.env locally, CI variables in CI).
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is required for e2e tests');
}

// E2E tests always use the dedicated test database, never DATABASE_URL.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = 'e2e-test-secret';
