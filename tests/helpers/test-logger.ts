import pino, { Logger } from 'pino';

/**
 * Creates Pino logger configured for test execution.
 */
export function createTestLogger(name = 'test'): Logger {
  return pino({
    name,
    level: process.env.LOG_LEVEL || 'error',
  });
}
