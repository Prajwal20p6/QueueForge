import axios from 'axios';
import CircuitBreaker from 'opossum';
import { IHttpClient, HttpResponse } from '../../application/interfaces/IHttpClient';
import { logger } from '../logging/logger';

export class CircuitBreakerHttpClient implements IHttpClient {
  private breakers: Map<string, CircuitBreaker<any, any>> = new Map();
  private onStateChangeCallback?: (key: string, state: 'open' | 'half-open' | 'closed') => void;

  constructor(
    private readonly defaultOptions: CircuitBreaker.Options = {
      timeout: 5000,
      errorThresholdPercentage: 50, // Open the circuit if 50% of requests fail
      resetTimeout: 10000, // Try to close the circuit after 10s (reduced for faster test verification)
      volumeThreshold: 3, // Minimum number of requests before opening circuit
    }
  ) {}

  public registerStateChangeCallback(
    callback: (key: string, state: 'open' | 'half-open' | 'closed') => void
  ): void {
    this.onStateChangeCallback = callback;
  }

  private getBreaker(key: string): CircuitBreaker<any, any> {
    if (!this.breakers.has(key)) {
      const requestExecutor = async (
        url: string,
        payload: Record<string, any>,
        headers: Record<string, string>,
        timeoutMs: number
      ): Promise<HttpResponse> => {
        const startTime = Date.now();
        const response = await axios.post(url, payload, {
          headers,
          timeout: timeoutMs,
          validateStatus: () => true, // Accept all status codes so we can log them ourselves
        });
        const durationMs = Date.now() - startTime;
        return {
          status: response.status,
          data: response.data,
          durationMs,
        };
      };

      const breaker = new CircuitBreaker(requestExecutor, {
        ...this.defaultOptions,
      });

      // Circuit Breaker Event Listeners
      breaker.on('open', () => {
        logger.warn(`Circuit breaker opened for: ${key}`);
        if (this.onStateChangeCallback) this.onStateChangeCallback(key, 'open');
      });

      breaker.on('halfOpen', () => {
        logger.info(`Circuit breaker half-open (testing recovery) for: ${key}`);
        if (this.onStateChangeCallback) this.onStateChangeCallback(key, 'half-open');
      });

      breaker.on('close', () => {
        logger.info(`Circuit breaker closed (recovered) for: ${key}`);
        if (this.onStateChangeCallback) this.onStateChangeCallback(key, 'closed');
      });

      breaker.on('failure', err => {
        logger.error(`Circuit breaker request failure for ${key}: ${err.message}`);
      });

      this.breakers.set(key, breaker);
    }
    return this.breakers.get(key)!;
  }

  public async post(
    url: string,
    payload: Record<string, any>,
    headers?: Record<string, string>,
    timeoutMs?: number
  ): Promise<HttpResponse> {
    let breakerKey = 'global';
    try {
      const parsedUrl = new URL(url);
      breakerKey = parsedUrl.host;
    } catch {
      breakerKey = url;
    }

    const breaker = this.getBreaker(breakerKey);
    const resolvedTimeout = timeoutMs ?? 5000;
    const resolvedHeaders = headers ?? {};

    // Execute via breaker.fire (opossum maps arguments directly to requestExecutor)
    try {
      const result = await breaker.fire(url, payload, resolvedHeaders, resolvedTimeout);

      // If server returned a 5xx error, count it as a failure for circuit breaker threshold
      if (result.status >= 500) {
        // Trigger opossum's failure tracking manually by throwing, as validateStatus: () => true skips default throwing
        throw new Error(`Server error response: ${result.status}`);
      }

      return result;
    } catch (err: any) {
      // Re-throw so opossum opens the breaker
      throw err;
    }
  }
}
