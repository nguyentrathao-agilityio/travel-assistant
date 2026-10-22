import baseConfig from './jest.config.js';

/** @type {import('jest').Config} */
const config = {
  ...baseConfig,
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  globalSetup: '<rootDir>/test/global-setup.ts',
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  // All e2e suites share one test database.
  maxWorkers: 1,
};

export default config;
