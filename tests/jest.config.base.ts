import type { Config } from 'jest';

/**
 * Shared base Jest configuration for QueueForge test suites.
 */
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', 'src', 'tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@config$': '<rootDir>/src/config/index',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@shared$': '<rootDir>/src/shared/index',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@infrastructure$': '<rootDir>/src/infrastructure/index',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@domain$': '<rootDir>/src/domain/index',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@application$': '<rootDir>/src/application/index',
    '^@security/(.*)$': '<rootDir>/src/security/$1',
    '^@security$': '<rootDir>/src/security/index',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@api$': '<rootDir>/src/api/index',
    '^@resilience/(.*)$': '<rootDir>/src/resilience/$1',
    '^@resilience$': '<rootDir>/src/resilience/index',
    '^@worker/(.*)$': '<rootDir>/src/worker/$1',
    '^@worker$': '<rootDir>/src/worker/index',
    '^@daemon/(.*)$': '<rootDir>/src/daemon/$1',
    '^@daemon$': '<rootDir>/src/daemon/index',
    '^@observability/(.*)$': '<rootDir>/src/observability/$1',
    '^@observability$': '<rootDir>/src/observability/index',
    '^@bootstrap/(.*)$': '<rootDir>/src/bootstrap/$1',
    '^@bootstrap$': '<rootDir>/src/bootstrap/index',
  },
  globalSetup: '<rootDir>/tests/setup.ts',
  globalTeardown: '<rootDir>/tests/teardown.ts',
  verbose: true,
};

export default config;
