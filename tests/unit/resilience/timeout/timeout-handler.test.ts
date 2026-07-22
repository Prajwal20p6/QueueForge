import { TimeoutHandler } from '../../../../src/resilience/timeout/timeout-handler';
import { TimeoutError } from '../../../../src/resilience/errors/timeout-error';

describe('TimeoutHandler Unit Tests', () => {
  let handler: TimeoutHandler;

  beforeEach(() => {
    handler = new TimeoutHandler();
  });

  it('should complete operation when finished before timeout deadline', async () => {
    const fn = async () => 'FAST_RESULT';
    const result = await handler.executeWithTimeout(fn, 1000, 'FastOp');
    expect(result).toBe('FAST_RESULT');
  });

  it('should throw TimeoutError when operation exceeds timeout deadline', async () => {
    const slowFn = () => new Promise(res => setTimeout(res, 200));

    await expect(handler.executeWithTimeout(slowFn, 50, 'SlowOp')).rejects.toThrow(TimeoutError);
  });

  it('should return fallback value when operation times out or fails', async () => {
    const slowFn = () => new Promise<string>(res => setTimeout(() => res('slow'), 200));
    const fallback = () => 'FALLBACK_VALUE';

    const result = await handler.executeWithTimeoutAndFallback(slowFn, 50, fallback, 'FallbackOp');
    expect(result).toBe('FALLBACK_VALUE');
  });
});
