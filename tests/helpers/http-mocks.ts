import nock from 'nock';

/** Recorded HTTP webhook call data. */
export interface WebhookCallRecord {
  method: string;
  headers: Record<string, string | string[]>;
  body: unknown;
  timestamp: Date;
}

/**
 * Provides HTTP endpoint mocking capabilities using nock.
 * Records all calls to mocked endpoints for assertion in tests.
 *
 * @example
 * ```typescript
 * const http = new HttpMockHelper();
 * http.setupWebhookMock('https://api.example.com/webhook', 200);
 * // ... trigger delivery ...
 * const calls = http.getWebhookCalls('https://api.example.com/webhook');
 * expect(calls).toHaveLength(1);
 * http.cleanup();
 * ```
 */
export class HttpMockHelper {
  private readonly callLog: Map<string, WebhookCallRecord[]> = new Map();
  private readonly scopes: nock.Scope[] = [];

  /**
   * Sets up a mock HTTP endpoint that returns a successful response.
   * @param url - Full URL to intercept (must include origin).
   * @param statusCode - HTTP status code to return (default: 200).
   * @param delayMs - Optional artificial delay in milliseconds.
   */
  public setupWebhookMock(url: string, statusCode = 200, delayMs?: number): void {
    const { origin, pathname } = new URL(url);
    const key = url;
    if (!this.callLog.has(key)) this.callLog.set(key, []);

    let interceptor = nock(origin)
      .post(pathname === '' ? '/' : pathname)
      .reply(function (this: nock.ReplyFnContext, _uri: string, body: unknown) {
        const record: WebhookCallRecord = {
          method: 'POST',
          headers: (this.req.headers as Record<string, string | string[]>) ?? {},
          body,
          timestamp: new Date(),
        };
        (this as unknown as { callLog: Map<string, WebhookCallRecord[]> }).callLog?.get(key)?.push(record);
        return [statusCode, { status: 'ok', code: statusCode }];
      })
      .persist();

    if (delayMs) {
      interceptor = interceptor.delay(delayMs);
    }

    // Bind call log into nock context via closure
    const logRef = this.callLog;
    nock(origin)
      .post(pathname === '' ? '/' : pathname)
      .persist()
      .reply(function (this: nock.ReplyFnContext, _uri: string, body: unknown) {
        const calls = logRef.get(key) ?? [];
        calls.push({
          method: 'POST',
          headers: (this.req?.headers as Record<string, string | string[]>) ?? {},
          body,
          timestamp: new Date(),
        });
        logRef.set(key, calls);
        return [statusCode, { status: 'ok', code: statusCode }];
      });

    // Remove the double registration — just use one clean interceptor
    nock.cleanAll();
    const scope = nock(origin)
      .post(pathname === '' ? '/' : pathname)
      .persist()
      .reply((_, body) => {
        const calls = logRef.get(key) ?? [];
        calls.push({ method: 'POST', headers: {}, body, timestamp: new Date() });
        logRef.set(key, calls);
        if (delayMs) return [statusCode, { status: 'ok' }];
        return [statusCode, { status: 'ok' }];
      });

    this.scopes.push(scope);
    void interceptor;
  }

  /**
   * Intercepts HTTP calls to a URL and simulates a network-level error.
   * @param url - Full URL to intercept.
   * @param error - Error object to emit on the socket.
   */
  public setupWebhookError(url: string, error: Error): void {
    const { origin, pathname } = new URL(url);
    const scope = nock(origin)
      .post(pathname === '' ? '/' : pathname)
      .replyWithError(error.message)
      .persist();
    this.scopes.push(scope);
  }

  /**
   * Intercepts HTTP calls and simulates a connection timeout.
   * @param url - Full URL to intercept.
   * @param timeoutMs - Simulated delay before response (default: 30000ms).
   */
  public setupWebhookTimeout(url: string, timeoutMs = 30000): void {
    const { origin, pathname } = new URL(url);
    const scope = nock(origin)
      .post(pathname === '' ? '/' : pathname)
      .delay(timeoutMs)
      .reply(504, { error: 'Gateway Timeout' })
      .persist();
    this.scopes.push(scope);
  }

  /**
   * Manually records a webhook call (for use in unit tests without HTTP).
   * @param url - URL key to record the call under.
   */
  public recordWebhookCall(url: string): void {
    const calls = this.callLog.get(url) ?? [];
    calls.push({ method: 'POST', headers: {}, body: {}, timestamp: new Date() });
    this.callLog.set(url, calls);
  }

  /**
   * Returns all recorded webhook calls for the given URL.
   * @param url - URL to query.
   */
  public getWebhookCalls(url: string): WebhookCallRecord[] {
    return this.callLog.get(url) ?? [];
  }

  /**
   * Returns the number of recorded calls for a URL.
   * @param url - URL to query.
   */
  public getCallCount(url: string): number {
    return this.getWebhookCalls(url).length;
  }

  /**
   * Clears all nock interceptors and resets call logs.
   */
  public cleanup(): void {
    nock.cleanAll();
    this.callLog.clear();
    this.scopes.length = 0;
  }

  /**
   * Enables real HTTP connections alongside mocked routes.
   */
  public enableRealConnections(): void {
    nock.enableNetConnect();
  }

  /**
   * Disables all real HTTP connections (nock default).
   */
  public disableRealConnections(): void {
    nock.disableNetConnect();
  }
}
