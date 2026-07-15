import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts', '<rootDir>/src/test/globalMocks.ts'],
  moduleNameMapper: {
    // Path alias — mirrors tsconfig.json paths
    '^@/(.*)$': '<rootDir>/src/$1',
    // CSS modules → identity proxy (class names returned as-is)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Static assets → stub
    '\\.(jpg|jpeg|png|gif|svg|ico|webp)$': '<rootDir>/src/test/fileMock.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.test.json' }],
  },
  // Allow Jest to transform ESM-only packages (lucide-react, sonner)
  transformIgnorePatterns: ['/node_modules/(?!(lucide-react|sonner)/)'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
  // Collect coverage from all source files except stories and test infra
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/test/**',
    '!src/main.tsx',
    '!src/App.tsx',
  ],
};

export default config;
