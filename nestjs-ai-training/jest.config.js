// Jest runs in native ESM mode (NestJS 12 ships ESM only), so scripts pass
// --experimental-vm-modules. Use `import { jest } from '@jest/globals'` when
// you need the `jest` object; it is not a global in ESM mode.
/** @type {import('jest').Config} */
const config = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  // Relative imports use `.js` extensions (NodeNext); map them to the .ts source.
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: { '^.+\\.ts$': ['ts-jest', { useESM: true }] },
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/main.ts'],
};

export default config;
