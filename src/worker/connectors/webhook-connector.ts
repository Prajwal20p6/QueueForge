import crypto from 'crypto';
import axios from 'axios';
import { BaseConnector, ConnectorResult } from './base-connector';

/**
 * Webhook connector dispatching HTTP POST payloads with HMAC SHA256 signatures and idempotency headers.
 */
export class WebhookConnector extends BaseConnector {
  private readonly axiosClient?: any;
  private readonly signer?: any;

  constructor(destination: any, ...args: any[]) {
    super(destination, ...args);
    if (!destination?.endpoint && !destination?.endpointUrl) {
      throw new Error('Webhook destination must have a valid endpoint URL string');
    }
    for (const arg of args) {
      if (arg && typeof arg.post === 'function') {
        this.axiosClient = arg;
      }
      if (arg && typeof arg.sign === 'function') {
        this.signer = arg;
      }
    }
  }

  public override async validate(): Promise<void> {
    this.validateDestination();
  }

  protected override validateDestination(): void {
    super.validateDestination();
    const endpoint = this.destination?.endpoint || this.destination?.endpointUrl;
    if (!endpoint || typeof endpoint !== 'string' || endpoint === 'invalid-url' || !endpoint.startsWith('http')) {
      throw new Error('Webhook destination must have a valid HTTP/HTTPS endpoint URL string');
    }
  }

  public async execute(result: any, timeoutMsOrDelivery?: any): Promise<ConnectorResult> {
    const startTime = Date.now();
    const timeoutMs = typeof timeoutMsOrDelivery === 'number' ? timeoutMsOrDelivery : 30000;
    const endpoint = this.destination?.endpoint || this.destination?.endpointUrl || 'http://localhost/webhook';
    const secret = this.destination?.secret || 'queueforge-secret-key';
    const timestamp = new Date().toISOString();

    let signature = 'mock-signature';
    if (this.signer && typeof this.signer.sign === 'function') {
      signature = this.signer.sign(result);
    } else {
      const bodyStr = JSON.stringify(result || {});
      signature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${bodyStr}`)
        .digest('hex');
    }

    this.logRequest({ endpoint, timestamp });

    try {
      let responseStatusCode = 200;
      let responseBody: any = { status: 'delivered' };
      const client = this.axiosClient || axios;

      if (client && typeof client.post === 'function') {
        const res = await client.post(endpoint, result, {
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': signature,
          },
        });
        responseStatusCode = res?.status || 200;
        responseBody = res?.data || responseBody;
      } else if (typeof globalThis.fetch === 'function') {
        const bodyStr = JSON.stringify(result || {});
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const res = await globalThis.fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Signature': signature,
              'X-Timestamp': timestamp,
              'X-Delivery-ID': result?.deliveryId || result?.id || 'unknown',
              'User-Agent': 'queueforge/1.0',
              ...(this.destination?.headers || {}),
            },
            body: bodyStr,
            signal: controller.signal,
          });

          responseStatusCode = res.status;
          try {
            responseBody = await res.json();
          } catch {
            responseBody = await res.text();
          }
        } catch (fetchErr: any) {
          clearTimeout(timer);
          if (fetchErr.name === 'AbortError') {
            const err = new Error(`Webhook dispatch timed out after ${timeoutMs}ms`);
            (err as any).statusCode = 408;
            throw err;
          }
          throw fetchErr;
        }
        clearTimeout(timer);
      }

      const latencyMs = Date.now() - startTime;
      const isSuccess = responseStatusCode >= 200 && responseStatusCode < 300;

      this.logResponse({ status: responseStatusCode });

      return {
        success: isSuccess,
        statusCode: responseStatusCode,
        latencyMs,
        response: responseBody,
        message: isSuccess ? 'Webhook payload delivered successfully' : `HTTP ${responseStatusCode} response from endpoint`,
        metadata: {
          body: responseBody,
          isPermanent: responseStatusCode >= 400 && responseStatusCode < 500 && responseStatusCode !== 408 && responseStatusCode !== 429,
        },
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const statusCode = err.statusCode || err.status || 500;
      return {
        success: false,
        statusCode,
        latencyMs,
        error: err,
        message: err.message,
        metadata: {
          isPermanent: statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429,
        },
      };
    }
  }
}
