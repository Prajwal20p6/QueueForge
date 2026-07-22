export interface MockedHttpResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

/**
 * Mocking utility recording and stubbing HTTP endpoints for tests.
 */
export class HttpMocker {
  private readonly routes = new Map<string, MockedHttpResponse>();
  private readonly requests: { url: string; method: string; body: any; headers: any }[] = [];

  public mockEndpoint(method: string, url: string, response: MockedHttpResponse): void {
    this.routes.set(`${method.toUpperCase()}:${url}`, response);
  }

  public recordRequest(method: string, url: string, body?: any, headers?: any): void {
    this.requests.push({ method: method.toUpperCase(), url, body, headers });
  }

  public getRecordedRequests(): { url: string; method: string; body: any; headers: any }[] {
    return [...this.requests];
  }

  public clear(): void {
    this.routes.clear();
    this.requests.length = 0;
  }
}
