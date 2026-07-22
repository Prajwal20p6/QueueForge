import { RateLimitResult } from './advanced-rate-limiter';

/**
 * Helper building compliant HTTP header variables keys.
 */
export class RateLimitHeaderBuilder {
  /**
   * Compiles header object mapping limit parameters.
   */
  public static buildHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + result.resetSeconds),
      'Retry-After': result.allowed ? '0' : String(result.resetSeconds),
    };
  }
}
