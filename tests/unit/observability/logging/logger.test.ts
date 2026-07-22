import { Logger } from '../../../../src/observability/logging/logger';
import { LogContext } from '../../../../src/observability/logging/log-context';

describe('Logger Unit Tests', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger(
      {
        logLevel: 'debug',
        loggingEnabled: true,
      } as any,
      'test-service'
    );
  });

  it('should successfully write log outputs at debug, info, warn, and error levels', () => {
    expect(() => logger.debug('debug log message')).not.toThrow();
    expect(() => logger.info('info log message')).not.toThrow();
    expect(() => logger.warn('warn log message')).not.toThrow();
    expect(() => logger.error('error log message', new Error('fail'))).not.toThrow();
  });

  it('should support LogContext correlation tag properties', () => {
    const ctx = new LogContext('trace-101', 'span-202', 'user-303', 'tenant-404', 'req-505', {
      custom: 'value',
    });
    expect(() => logger.info('info with context', ctx)).not.toThrow();
  });
});
