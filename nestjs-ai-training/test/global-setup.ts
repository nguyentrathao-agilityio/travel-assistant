import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Applies all migrations to the test database once before the e2e run.
export default function globalSetup(): void {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('TEST_DATABASE_URL is required for e2e tests');
  }

  execFileSync('node_modules/.bin/prisma', ['migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
}
