// Mock OpenTelemetry API first to ensure it is loaded before imports
jest.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: () => ({
      startActiveSpan: (_name: any, cb: any) => {
        const mockSpan = {
          end: jest.fn(),
          recordException: jest.fn(),
          setStatus: jest.fn(),
        };
        return cb(mockSpan);
      },
    }),
  },
}));

import {
  Logged,
  Validate,
  Retry,
  RateLimit,
  Measure,
  Traced,
} from '../../../src/shared/decorators';
import { z } from 'zod';
import { ValidationError, RateLimitError } from '../../../src/shared/errors';

describe('Shared Layer Decorators', () => {
  let stdoutWriteMock: jest.SpyInstance;

  beforeEach(() => {
    stdoutWriteMock = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutWriteMock.mockRestore();
  });

  describe('@Logged', () => {
    class DummyService {
      @Logged()
      public syncHello(name: string): string {
        return `Hello ${name}`;
      }

      @Logged()
      public async asyncHello(name: string): Promise<string> {
        return Promise.resolve(`Hello ${name}`);
      }

      @Logged()
      public async asyncFail(): Promise<void> {
        throw new Error('Async crash');
      }
    }

    it('should log execution entry and exit for synchronous methods', () => {
      const service = new DummyService();
      const result = service.syncHello('Alice');
      expect(result).toBe('Hello Alice');
      expect(stdoutWriteMock).toHaveBeenCalled();

      const logOutput = stdoutWriteMock.mock.calls.map(c => c[0]).join('\n');
      expect(logOutput).toContain('Entering DummyService.syncHello');
      expect(logOutput).toContain('Exiting DummyService.syncHello');
    });

    it('should log execution entry and exit for asynchronous methods', async () => {
      const service = new DummyService();
      const result = await service.asyncHello('Bob');
      expect(result).toBe('Hello Bob');

      const logOutput = stdoutWriteMock.mock.calls.map(c => c[0]).join('\n');
      expect(logOutput).toContain('Entering DummyService.asyncHello');
      expect(logOutput).toContain('Exiting async DummyService.asyncHello');
    });

    it('should log failures for async methods throwing errors', async () => {
      const service = new DummyService();
      await expect(service.asyncFail()).rejects.toThrow('Async crash');

      const logOutput = stdoutWriteMock.mock.calls.map(c => c[0]).join('\n');
      expect(logOutput).toContain('Failed async DummyService.asyncFail');
    });
  });

  describe('@Validate', () => {
    const userSchema = z.object({
      name: z.string().min(3),
      age: z.coerce.number().positive(),
    });

    class ValidationService {
      @Validate(userSchema)
      public registerUser(user: any): any {
        return user;
      }
    }

    it('should pass and coerce parameters matching schema', () => {
      const service = new ValidationService();
      const user = { name: 'Alice', age: '30' }; // string age gets coerced to number by z.coerce
      const result = service.registerUser(user);
      expect(result.name).toBe('Alice');
      expect(result.age).toBe(30); // verified Zod coercion
    });

    it('should fail and throw ValidationError for payloads failing Zod schemas', () => {
      const service = new ValidationService();
      const invalidUser = { name: 'Al', age: -5 };
      expect(() => service.registerUser(invalidUser)).toThrow(ValidationError);
    });
  });

  describe('@Retry', () => {
    class RetryService {
      public attempts = 0;

      @Retry(3, 10) // 3 max attempts, 10ms base backoff
      public async fetchTask(failCount: number): Promise<string> {
        this.attempts++;
        if (this.attempts < failCount) {
          throw new Error('Transient error');
        }
        return 'success';
      }
    }

    it('should retry execution on failure and resolve if success happens within limits', async () => {
      const service = new RetryService();
      const result = await service.fetchTask(3); // fails 2 times, succeeds on 3rd attempt
      expect(result).toBe('success');
      expect(service.attempts).toBe(3);
    });

    it('should throw final error if all attempts fail', async () => {
      const service = new RetryService();
      await expect(service.fetchTask(4)).rejects.toThrow('Transient error');
      expect(service.attempts).toBe(3); // max attempts was 3
    });
  });

  describe('@RateLimit', () => {
    class RateLimitedService {
      @RateLimit(2) // limit to 2 requests per minute
      public getSecrets(): string {
        return 'secrets';
      }
    }

    it('should throw RateLimitError when method call count exceeds limit', () => {
      const service = new RateLimitedService();
      expect(service.getSecrets()).toBe('secrets');
      expect(service.getSecrets()).toBe('secrets');
      expect(() => service.getSecrets()).toThrow(RateLimitError);
    });
  });

  describe('@Measure', () => {
    class MonitoredService {
      @Measure()
      public calculate(): number {
        return 42;
      }
    }

    it('should execute decorated method and record duration without throwing', () => {
      const service = new MonitoredService();
      expect(service.calculate()).toBe(42);
    });
  });

  describe('@Traced', () => {
    class TracedService {
      @Traced()
      public runTransaction(): string {
        return 'done';
      }
    }

    it('should invoke trace active span wrapping methods', () => {
      const service = new TracedService();
      expect(service.runTransaction()).toBe('done');
    });
  });
});
