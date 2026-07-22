import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * HTTP client designed for E2E tests against the QueueForge test server.
 * Handles authentication headers, JSON parsing, and response capture.
 *
 * @example
 * ```typescript
 * const client = new TestClient('http://127.0.0.1:3001', 'my-api-key');
 * const res = await client.get('/api/v1/health');
 * expect(res.status).toBe(200);
 * ```
 */
export class TestClient {
  private readonly http: AxiosInstance;
  private lastResponse: AxiosResponse | null = null;
  private apiKey: string | null;
  private token: string | null = null;

  /**
   * @param baseUrl - Base URL of the test server (e.g., 'http://127.0.0.1:3001').
   * @param apiKey - Optional API key to include in X-API-Key header.
   */
  constructor(baseUrl: string, apiKey?: string) {
    this.apiKey = apiKey ?? null;
    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
      validateStatus: () => true, // never throw on HTTP errors — let tests assert
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Sends an HTTP POST request.
   * @param path - Request path (relative to baseUrl).
   * @param body - Optional JSON body.
   */
  public async post(path: string, body?: unknown): Promise<AxiosResponse> {
    const res = await this.http.post(path, body, { headers: this.buildAuthHeaders() });
    this.lastResponse = res;
    return res;
  }

  /**
   * Sends an HTTP GET request.
   * @param path - Request path.
   * @param query - Optional query string parameters.
   */
  public async get(path: string, query?: Record<string, unknown>): Promise<AxiosResponse> {
    const res = await this.http.get(path, {
      params: query,
      headers: this.buildAuthHeaders(),
    });
    this.lastResponse = res;
    return res;
  }

  /**
   * Sends an HTTP PATCH request.
   * @param path - Request path.
   * @param body - Optional JSON body.
   */
  public async patch(path: string, body?: unknown): Promise<AxiosResponse> {
    const res = await this.http.patch(path, body, { headers: this.buildAuthHeaders() });
    this.lastResponse = res;
    return res;
  }

  /**
   * Sends an HTTP DELETE request.
   * @param path - Request path.
   */
  public async delete(path: string): Promise<AxiosResponse> {
    const res = await this.http.delete(path, { headers: this.buildAuthHeaders() });
    this.lastResponse = res;
    return res;
  }

  /**
   * Updates the API key used in X-API-Key header.
   * @param apiKey - New API key string.
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.token = null;
  }

  /**
   * Updates the JWT token used in Authorization Bearer header.
   * @param token - JWT token string.
   */
  public setToken(token: string): void {
    this.token = token;
    this.apiKey = null;
  }

  /**
   * Returns the most recently received response.
   * @throws {Error} if no request has been made yet.
   */
  public getLastResponse(): AxiosResponse {
    if (!this.lastResponse) {
      throw new Error('[TestClient] No request has been made yet.');
    }
    return this.lastResponse;
  }

  /**
   * Asserts that the last response had the expected status code.
   * @param expectedStatus - Expected HTTP status code.
   */
  public assertLastStatus(expectedStatus: number): void {
    const res = this.getLastResponse();
    if (res.status !== expectedStatus) {
      throw new Error(
        `[TestClient] Expected HTTP ${expectedStatus} but got ${res.status}. ` +
          `Body: ${JSON.stringify(res.data)}`
      );
    }
  }

  /** Builds the authorization headers based on current auth state. */
  private buildAuthHeaders(): Record<string, string> {
    if (this.token) {
      return { Authorization: `Bearer ${this.token}` };
    }
    if (this.apiKey) {
      return { 'X-API-Key': this.apiKey };
    }
    return {};
  }
}
