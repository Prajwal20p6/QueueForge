export interface WebhookCall {
  timestamp: Date;
  url: string;
  payload: any;
  headers: Record<string, string>;
  statusCode: number;
}

/**
 * Mocker simulating remote webhook endpoints and capturing payloads.
 */
export class WebhookMocker {
  private readonly calls: WebhookCall[] = [];

  public mockWebhook(url: string, statusCode = 200, payload: any = { success: true }): void {
    this.calls.push({
      timestamp: new Date(),
      url,
      payload,
      headers: { 'content-type': 'application/json' },
      statusCode,
    });
  }

  public getWebhookCalls(): WebhookCall[] {
    return [...this.calls];
  }

  public clear(): void {
    this.calls.length = 0;
  }
}
