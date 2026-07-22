export interface HttpResponse {
  status: number;
  data: any;
  durationMs: number;
}

export interface IHttpClient {
  post(
    url: string,
    payload: Record<string, any>,
    headers?: Record<string, string>,
    timeoutMs?: number
  ): Promise<HttpResponse>;
}
